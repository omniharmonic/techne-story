// computeFrame: timeline position (plus reader actions) -> attributes for the
// persistent elements built in art.ts. Pure and deterministic: the same input
// always yields the same world, which is what makes reverse scroll, deep links
// and build-time stills agree with the live stage.

import {
  EDGES, FRIEND, FRIEND_EDGE, HOMES, NODES, OWNER, READER, RISK_SITES, SEG_DEST, TEMP_EDGE, TOWERS, VILLAGES,
  edgeIndex, graph, ground, openPos, towerBase, villageCenter, villagePos, type Pt,
} from './data.ts';
import { GROVE, STOPS } from './art.ts';
import { clamp, ease, knobs, lerp, seg, smooth, stagger, type Knobs } from './timeline.ts';
import { mix, r1, r2, type Frame } from './svg.ts';

export interface DemoState {
  kind: 'send-open' | 'send-captured' | 'send-freed' | 'send-alive' | 'ripple' | 'ripple-captured' | 'scope';
  ms: number;
  node?: number;
  group?: number;
  scope?: number;
}

export interface FrameInput {
  T: number;
  /** World units per CSS pixel at camera scale 1. */
  upp: number;
  beadPx: number;
  specialPx: number;
  labelPx: number;
  /** Visible world rectangle at camera scale 1. */
  bounds: { x0: number; y0: number; x1: number; y1: number };
  intro: number;
  demo: DemoState | null;
  /** Reader position override in graph coordinates (leave, migrate, choose a home). */
  reader: { gx: number; gy: number } | null;
  cut: number;
  risks: number[];
  community: number;
  /** Secondary in-art labels (desktop only; the same words are always in the HTML). */
  labels: boolean;
}

export const DEMO_MS: Record<string, number> = {
  'send-open': 2600, 'send-captured': 3200, 'send-freed': 2600, 'send-alive': 5800,
  ripple: 3500, 'ripple-captured': 900,
};
export const scopeMs = (scope: number) => [1200, 2400, 600][scope];

const CAM = { x: 560, y: 300 };
const SAGE = '#A9D3B1', AMBER = '#E9BC67', IVORY = '#F1EBDD';

// --- Graph helpers computed once ------------------------------------------------

const ADJ: number[][] = NODES.map(() => []);
EDGES.forEach((e, i) => { ADJ[e.a].push(i); ADJ[e.b].push(i); });

const bfsCache = new Map<number, { level: number[]; parents: number[]; max: number }>();
const bfs = (start: number) => {
  let hit = bfsCache.get(start);
  if (hit) return hit;
  const level = NODES.map(() => -1);
  const parents = NODES.map(() => 0);
  level[start] = 0;
  let frontier = [start], max = 0;
  while (frontier.length) {
    const next: number[] = [];
    for (const n of frontier) for (const ei of ADJ[n]) {
      const m = EDGES[ei].a === n ? EDGES[ei].b : EDGES[ei].a;
      if (level[m] === -1) { level[m] = level[n] + 1; max = level[m]; next.push(m); }
      if (level[m] === level[n] + 1) parents[m]++;
    }
    frontier = next;
  }
  bfsCache.set(start, (hit = { level, parents, max }));
  return hit;
};

/** The two relationships nearest each recapture site in the community layout. */
export const RISK_EDGES: number[][] = RISK_SITES.map(([gx, gy]) => {
  const c = graph(gx, gy);
  return EDGES.map((e, i) => {
    const p = villagePos(e.a), q = villagePos(e.b);
    return { i, d: Math.hypot((p.x + q.x) / 2 - c.x, (p.y + q.y) / 2 - c.y) };
  }).sort((a, b) => a.d - b.d).slice(0, 2).map((x) => x.i);
});

const STACK_H = [0.25, 0.2, 0.17, 0.15, 0.13, 0.1];
const STACK_W_PEAK = [1, 0.9, 0.8, 0.7, 0.6, 0.52];
const STACK_W_LOW = [1, 0.94, 0.88, 0.82, 0.76, 0.7];
const FAN_RANK = [6, 7, 5, 4, 3, 2, 1, 0]; // top of the stack leaves first, buttresses last

// --- Geometry -------------------------------------------------------------------

export interface EdgeGeom { p: Pt[]; c: Pt[]; r: number }

const sub = (a: Pt, b: Pt) => ({ x: a.x - b.x, y: a.y - b.y });
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const mixPt = (a: Pt, b: Pt, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Fixed structure for every relationship: three cubic segments through P0, A, B, P1. */
export const edgeGeom = (P0: Pt, P1: Pt, sign: number, r: number, ga: Pt, gb: Pt, push?: Pt): EdgeGeom => {
  const d = sub(P1, P0);
  const len = Math.hypot(d.x, d.y) || 1;
  const nx = (-d.y / len) * 0.04 * len * sign, ny = (d.x / len) * 0.04 * len * sign;
  let A = { x: P0.x + d.x / 3 + nx, y: P0.y + d.y / 3 + ny };
  let B = { x: P0.x + (2 * d.x) / 3 + nx, y: P0.y + (2 * d.y) / 3 + ny };
  if (push) { A = { x: A.x + push.x, y: A.y + push.y }; B = { x: B.x + push.x, y: B.y + push.y }; }
  if (r > 0) { A = mixPt(A, ga, r); B = mixPt(B, gb, r); }
  const ab = dist(A, B);
  const tan = (from: Pt, to: Pt, near: number) => {
    const v = sub(to, from);
    const l = Math.hypot(v.x, v.y) || 1;
    const m = (Math.min(near, ab) / 3) * (1 - 0.9 * r);
    return { x: (v.x / l) * m, y: (v.y / l) * m };
  };
  const tA = tan(P0, B, dist(P0, A)), tB = tan(A, P1, dist(B, P1));
  const c = [
    mixPt(P0, A, 1 / 3), { x: A.x - tA.x, y: A.y - tA.y },
    { x: A.x + tA.x, y: A.y + tA.y }, { x: B.x - tB.x, y: B.y - tB.y },
    { x: B.x + tB.x, y: B.y + tB.y }, mixPt(B, P1, 2 / 3),
  ];
  return { p: [P0, A, B, P1], c, r };
};

const P = (p: Pt) => `${r1(p.x)},${r1(p.y)}`;
const legD = (g: EdgeGeom, leg: number) => `M${P(g.p[leg])} C${P(g.c[leg * 2])} ${P(g.c[leg * 2 + 1])} ${P(g.p[leg + 1])}`;
export const edgeD = (g: EdgeGeom) =>
  `M${P(g.p[0])} C${P(g.c[0])} ${P(g.c[1])} ${P(g.p[1])} C${P(g.c[2])} ${P(g.c[3])} ${P(g.p[2])} C${P(g.c[4])} ${P(g.c[5])} ${P(g.p[3])}`;

const legPoint = (g: EdgeGeom, leg: number, t: number): Pt => {
  const a = g.p[leg], b = g.c[leg * 2], c = g.c[leg * 2 + 1], d = g.p[leg + 1], u = 1 - t;
  const w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
  return { x: w0 * a.x + w1 * b.x + w2 * c.x + w3 * d.x, y: w0 * a.y + w1 * b.y + w2 * c.y + w3 * d.y };
};
/** Point along a whole relationship, 0 at its first person and 1 at its second. */
const edgePoint = (g: EdgeGeom, s: number): Pt => {
  const x = clamp(s) * 3;
  const leg = Math.min(2, Math.floor(x));
  return legPoint(g, leg, x - leg);
};

const palette = (id: string, day: number) => {
  const c = STOPS[id];
  if (c.length === 2) return mix(c[0], c[1], day);
  return day < 0.4 ? mix(c[0], c[1], day / 0.4) : mix(c[1], c[2], (day - 0.4) / 0.6);
};

const bump = (x: number) => (x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x));

export interface FrameContext {
  k: Knobs;
  uppEff: number;
  pos: Pt[];
  geom: EdgeGeom[];
  gates: Pt[];
  towers: { x: number; yBase: number; yRes: number; H: number }[];
}

export interface AmbientPhase { ext: number; rec: number; rib: number }

export const computeFrame = (input: FrameInput): { frame: Frame; ctx: FrameContext } => {
  const { T } = input;
  const k = knobs(T);
  const f: Frame = {};
  const cam = k.camera;
  const uppEff = input.upp / cam;
  const px = (n: number) => n * uppEff;

  // --- Camera and the three depth planes ---
  f.cam = { transform: `translate(${r1(CAM.x - (CAM.x + k.panX) * cam)},${r1(CAM.y - (CAM.y + k.panY) * cam)}) scale(${r2(cam * 1000) / 1000})` };
  f.pFar = { transform: `translate(${r1(k.panX * 0.8)},${r1(k.panY * 0.8 + (cam - 1) * 60)})` };
  f.pFg = { transform: `translate(${r1(-k.panX * 0.6)},${r1(-k.panY * 0.5 + (cam - 1) * 46)})` };

  // --- Lighting: night, conflict gloom, dawn, day ---
  const day = k.day;
  const gloom = k.shadow * 0.28 * (1 - day);
  f.terrainDay = { opacity: r2(day) };
  f.terrainGloom = { opacity: r2(gloom) };
  for (const id in STOPS) {
    let c = palette(id, day);
    if (gloom > 0 && (id.startsWith('gnd') || id.startsWith('md') || id === 'sky2' || id.startsWith('hill'))) c = mix(c, '#040F14', gloom);
    f[id] = { 'stop-color': c };
  }
  f.glow1 = { 'stop-color': palette('glow0', day) };
  f.haze0 = { 'stop-color': palette('sky2', day) };
  f.haze1 = { 'stop-color': palette('sky2', day) };
  f.glow0 = { 'stop-color': palette('glow0', day), 'stop-opacity': r2(0.5 + 0.35 * day) };
  const commons = k.fan;
  f.seg0 = { 'stop-color': mix('#4A7068', '#F5E8C8', commons) };
  f.seg1 = { 'stop-color': mix('#213F3F', '#D9C69D', commons) };
  f.seg2 = { 'stop-color': mix('#0B1D22', '#A6906B', commons) };
  f.segD = { 'stop-color': mix('#061317', '#5E4B38', commons) };
  f.win = { 'stop-color': mix('#B58A4F', '#FFD98A', k.lights), 'stop-opacity': r2(clamp(0.5 - 0.25 * k.lampDim + 0.5 * k.lights)) };
  f.riverGlint = { 'stroke-opacity': r2(0.16 + 0.4 * day) };

  // --- People ---
  const pos: Pt[] = NODES.map((_, i) => {
    const m = stagger(k.move, i, 24, 0.7);
    return m <= 0 ? openPos(i) : mixPt(openPos(i), villagePos(i), m);
  });
  if (input.reader) pos[READER] = graph(input.reader.gx, input.reader.gy);

  // --- Towers ---
  const gates: Pt[] = [];
  const towers: FrameContext['towers'] = [];
  const hk = k.height;
  TOWERS.forEach((t, ti) => {
    const b = towerBase(ti);
    const plat = k.platform;
    const H = lerp(t.hLow, t.hPeak, hk) * plat;
    const W = lerp(t.wLow, t.wPeak, hk);
    gates.push({ x: b.x, y: b.y + 8 });
    let cum = 0;
    let topY = b.y, topW = W, topH = 0;
    for (let s = 0; s < 8; s++) {
      let x: number, y: number, w: number, hh: number;
      if (s < 2) {
        const side = s === 0 ? -1 : 1;
        x = b.x + side * W * (0.47 + 0.06 * k.seams);
        y = b.y + (s === 0 ? 5 : 7);
        w = W * (s === 0 ? 0.4 : 0.43);
        hh = H * (s === 0 ? lerp(0.52, 0.43, hk) : lerp(0.46, 0.36, hk));
      } else {
        const j = s - 2;
        w = W * lerp(STACK_W_LOW[j], STACK_W_PEAK[j], hk);
        hh = H * STACK_H[j];
        x = b.x + (j % 2 ? 1 : -1) * k.seams * (3 + j * 2.4);
        y = b.y - H * cum - k.seams * j * 3.2;
        cum += STACK_H[j];
        if (j === 5) { topY = b.y - H; topW = w; topH = hh; }
        hh *= 1.07;
      }
      const dest = SEG_DEST[ti][s];
      const fl = stagger(k.fan, FAN_RANK[s], 8, 0.7);
      if (fl > 0) {
        const e = fl;
        const d = ground(dest.u, dest.v);
        x = lerp(x, d.x, e); y = lerp(y, d.y, e); w = lerp(w, dest.w, e); hh = lerp(hh, dest.h, e);
      }
      const id = `${t.id}-${String(s + 1).padStart(2, '0')}`;
      f[id] = { transform: `translate(${r1(x)},${r1(y)}) scale(${r2(w / 100)},${r2(Math.max(0.001, hh / 100))})`, opacity: plat > 0 ? 1 : 0 };
      f[`${id}r`] = { opacity: dest.form === 'pavilion' ? r2(fl * fl * (0.35 + 0.65 * k.trees)) : 0 };
    }
    const standing = (1 - k.fan) * plat;
    f[`${t.id}base`] = { opacity: r2(plat * (0.9 - 0.3 * k.fan)) };
    f[`${t.id}yard`] = { opacity: r2(k.fan * (0.55 + 0.45 * k.garden)) };
    f[`${t.id}cast`] = {
      cx: r1(b.x - H * 0.3), cy: r1(b.y + 6 + H * 0.05), rx: r1(W * 0.5 + H * 0.46), ry: r1(14 + H * 0.075),
      opacity: r2(0.7 * standing * (1 - 0.5 * day)),
    };
    const rw = topW * 0.58, rh = Math.max(5, topH * 0.62), rx = b.x - rw / 2, ry = topY + topH * 0.2;
    const resOp = r2(plat * (1 - k.seams) * clamp(k.extract * 6 + k.captureIn));
    f[`${t.id}res`] = { opacity: resOp };
    f[`${t.id}resBg`] = { x: r1(rx), y: r1(ry), width: r1(rw), height: r1(rh) };
    f[`${t.id}resGlow`] = { x: r1(rx - 14), y: r1(ry - 14), width: r1(rw + 28), height: r1(rh + 28), opacity: r2(k.fill) };
    const fh = Math.max(0, (rh - 3) * k.fill);
    f[`${t.id}resFill`] = { x: r1(rx + 1.5), y: r1(ry + rh - 1.5 - fh), width: r1(rw - 3), height: r1(fh) };
    f[`${t.id}ch`] = { y: r1(ry + rh), height: r1(Math.max(0, b.y - ry - rh)), opacity: r2(clamp(k.extract * 1.4) * (1 - k.seams) * plat * 0.9) };
    towers.push({ x: b.x, yBase: b.y, yRes: ry + rh * 0.5, H });
  });

  // --- AI feedback ribbon ---
  {
    const b = [towerBase(0), towerBase(1), towerBase(2)];
    const loops: [string, number, number, number, number][] = [
      ['A', (b[1].x + b[0].x) / 2, (b[1].y + b[0].y) / 2 - 0.8 * towers[1].H, (b[0].x - b[1].x) / 2 + 74, 13 + towers[1].H * 0.075],
      ['B', (b[0].x + b[2].x) / 2, (b[0].y + b[2].y) / 2 - 0.78 * towers[2].H, (b[2].x - b[0].x) / 2 + 70, 12 + towers[2].H * 0.07],
      ['C', b[0].x, b[0].y - 0.8 * towers[0].H, TOWERS[0].wPeak * 0.5 + 40, 10 + towers[0].H * 0.04],
    ];
    loops.forEach(([id, cx, cy, rx, ry], i) => {
      const part = clamp(k.ribbon * 1.6 - i * 0.3);
      const len = Math.PI * Math.sqrt((rx * rx + ry * ry) / 2);
      const back = `M${r1(cx - rx)},${r1(cy)} A${r1(rx)},${r1(ry)} 0 0 1 ${r1(cx + rx)},${r1(cy)}`;
      const front = `M${r1(cx + rx)},${r1(cy)} A${r1(rx)},${r1(ry)} 0 0 1 ${r1(cx - rx)},${r1(cy)}`;
      const dash = `${r1(len * part)} ${r1(len + 4)}`;
      f[`rb${id}-b`] = { d: back, opacity: r2(part * 0.7), 'stroke-dasharray': dash };
      f[`rb${id}-f`] = { d: front, opacity: r2(part), 'stroke-dasharray': dash };
      f[`rb${id}-g`] = { d: front, opacity: r2(part) };
      f[`rb${id}-t`] = { d: front, opacity: r2(part * 0.9) };
    });
  }

  // --- Relationships ---
  const D = input.demo;
  const ripple = D && D.kind === 'ripple' ? bfs(D.node ?? 0) : null;
  const pushes = new Map<number, Pt>();
  RISK_SITES.forEach(([gx, gy], i) => {
    const amt = k.recapture * (1 - (input.risks[i] ?? 0));
    if (amt <= 0) return;
    const c = graph(gx, gy);
    for (const ei of RISK_EDGES[i]) {
      const e = EDGES[ei];
      const m = mixPt(pos[e.a], pos[e.b], 0.5);
      const v = sub(c, m);
      const l = Math.hypot(v.x, v.y) || 1;
      const reach = Math.min(l, 0.06 * 860) * amt;
      pushes.set(ei, { x: (v.x / l) * reach * 1.5, y: (v.y / l) * reach * 1.5 });
    }
  });

  const amberMix = clamp(k.extract * 1.5);
  const geom: EdgeGeom[] = EDGES.map((e, i) => {
    const capIn = stagger(k.captureIn, e.index, 36, 0.3);
    const out = i === FRIEND_EDGE ? k.friendBypass : stagger(k.releaseOut, e.index, 36, 0.4);
    const r = capIn * (1 - out);
    const g = edgeGeom(pos[e.a], pos[e.b], e.index % 2 ? 1 : -1, r, gates[OWNER[NODES[e.a].group]], gates[OWNER[NODES[e.b].group]], pushes.get(i));

    const introOp = i === FRIEND_EDGE ? seg(input.intro, 0.15, 0.45) : seg(input.intro, 0.4 + 0.4 * (e.index / 36), 0.6 + 0.4 * (e.index / 36));
    let hl = 0;
    if (ripple && D) {
      const la = ripple.level[e.a], lb = ripple.level[e.b];
      const d = Math.min(Math.min(la, lb), 6);
      hl = Math.max(bump((D.ms - d * 250) / 420), bump((D.ms - 1500 - (Math.min(ripple.max, 6) - d) * 250) / 420));
    }
    let color = mix(SAGE, AMBER, r * amberMix);
    color = mix(color, IVORY, Math.max(hl, k.loops * 0.3));
    const incident = e.a === READER || e.b === READER;
    const op = introOp * (0.84 + 0.12 * k.loops + 0.16 * hl) * (incident ? 1 - input.cut : 1);
    const width = lerp(1.25, e.kind === 'bridge' ? 1.15 : 1.9, k.move) + hl * 1.2 + (i === FRIEND_EDGE ? 0.5 * k.friendBypass * (1 - k.move) : 0);
    const d = edgeD(g);
    f[e.id] = { d, stroke: color, 'stroke-width': r2(width), opacity: r2(clamp(op)), 'stroke-dasharray': incident && input.cut > 0 ? '2 6' : 'none' };
    f[`c${e.id}`] = { d, 'stroke-width': r2(width + 1.8), opacity: r2(clamp(op) * (0.24 + 0.5 * day)) };
    return g;
  });

  // --- People beads and the two labels ---
  const rp = ripple;
  NODES.forEach((n, i) => {
    const special = i === READER || i === FRIEND;
    const introOp = special ? seg(input.intro, 0, 0.2) : seg(input.intro, 0.25 + 0.5 * (i / 24), 0.45 + 0.5 * (i / 24));
    const radius = px(special ? input.specialPx : input.beadPx);
    f[n.id] = {
      transform: `translate(${r1(pos[i].x)},${r1(pos[i].y)}) scale(${r2(radius * (0.6 + 0.4 * introOp))})`,
      opacity: r2(introOp * (special ? 1 : 1 - 0.42 * k.nodeDim)),
    };
    let halo = 0;
    if (rp && D) {
      const l = Math.min(rp.level[i], 6);
      const strength = rp.parents[i] >= 2 ? 1 : 0.55;
      halo = strength * Math.max(bump((D.ms - l * 250 + 60) / 480), bump((D.ms - 1500 - (Math.min(rp.max, 6) - l) * 250 + 60) / 480));
    }
    f[`h${n.id}`] = { opacity: r2(halo) };
  });

  const vis = {
    x0: CAM.x + (input.bounds.x0 - CAM.x) / cam + k.panX, x1: CAM.x + (input.bounds.x1 - CAM.x) / cam + k.panX,
    y0: CAM.y + (input.bounds.y0 - CAM.y) / cam + k.panY, y1: CAM.y + (input.bounds.y1 - CAM.y) / cam + k.panY,
  };
  const fs = px(input.labelPx);
  const labelOp = r2(seg(input.intro, 0.1, 0.4));
  {
    const p = pos[READER];
    const below = k.homes < 0.5 && p.y + px(input.specialPx * 2.15 + 18) < vis.y1 - px(4);
    f.lblYou = { x: r1(p.x), y: r1(below ? p.y + px(input.specialPx * 2.15 + 16) : p.y - px(input.specialPx * 2.15 + 8)), 'font-size': r1(fs), 'text-anchor': 'middle', opacity: labelOp };
    const q = pos[FRIEND];
    const right = q.x + px(input.specialPx * 1.62 + 10) + fs * 5 < vis.x1 - px(4);
    f.lblFriend = right
      ? { x: r1(q.x + px(input.specialPx * 1.62 + 10)), y: r1(q.y + fs * 0.32), 'font-size': r1(fs), 'text-anchor': 'start', opacity: labelOp }
      : { x: r1(Math.min(q.x, vis.x1 - fs * 2.6 - px(4))), y: r1(q.y - px(input.specialPx * 1.62 + 10)), 'font-size': r1(fs), 'text-anchor': 'middle', opacity: labelOp };
    if (!input.labels) {
      f.lblYou = { x: r1(p.x - px(12)), y: r1(p.y - px(10)), 'font-size': r1(fs), 'text-anchor': 'end', opacity: labelOp };
    }
  }

  // --- Scene 6: the four functions come apart ---
  {
    const travel = seg(T, 5.6, 6);
    const op = seg(T, 5.6, 5.72) * (1 - seg(T, 7.2, 7.6));
    const r = pos[READER];
    const dests: Pt[] = [
      { x: r.x - px(26), y: r.y - px(30) }, { x: r.x + px(30), y: r.y - px(30) }, graph(0.4, 0.66), graph(0.6, 0.44),
    ];
    const anchors = ['end', 'start', 'middle', 'middle'];
    dests.forEach((d, i) => {
      const p = mixPt(gates[0], d, travel);
      f[`fn${i}`] = { transform: `translate(${r1(p.x)},${r1(p.y)}) scale(${r2(px(9))})`, opacity: r2(op) };
      const side = i === 0 ? -1 : i === 1 ? 1 : 0;
      f[`lblFn${i}`] = {
        x: r1(p.x + side * px(13)), y: r1(side ? p.y - px(12) : p.y - px(14)), 'font-size': r1(fs), 'text-anchor': anchors[i],
        opacity: input.labels ? r2(op * seg(T, 5.85, 6) * (1 - seg(T, 6.05, 6.4))) : 0,
      };
    });
    ([[0.25, 0.2], [0.8, 0.5], [0.55, 0.86]] as [number, number][]).forEach(([gx, gy], i) => {
      const p = graph(gx, gy);
      f[`lens${i}`] = { transform: `translate(${r1(p.x)},${r1(p.y)}) scale(${r2(px(8))})`, opacity: r2(op * travel * 0.55) };
    });
  }

  // --- Scene 7 homes, community hosts and perimeters, recapture sites ---
  HOMES.forEach(([gx, gy], i) => {
    const p = graph(gx, gy);
    f[`home${i}`] = { transform: `translate(${r1(p.x)},${r1(p.y)}) scale(${r2(px(11))})`, opacity: r2(k.homes) };
    f[`lblHome${i}`] = { x: r1(p.x), y: r1(p.y + px(30)), 'font-size': r1(fs), 'text-anchor': 'middle', opacity: r2(k.homes) };
  });
  VILLAGES.forEach((_, g) => {
    const c = villageCenter(g);
    const sel = input.community === g || (D?.kind === 'scope' && D.group === g);
    f[`host${g}`] = { transform: `translate(${r1(c.x)},${r1(c.y - 2)}) scale(${r2(px(6.5))})`, opacity: r2(k.boundary * 0.85) };
    f[`ring${g}`] = { opacity: r2(k.boundary * (sel ? 1 : 0.7)), 'stroke-width': sel ? 2.6 : 1.2, stroke: sel ? IVORY : SAGE };
    f[`gard${g}`] = { opacity: k.garden > 0 ? 1 : 0, 'stroke-dashoffset': r2(1 - k.garden), 'fill-opacity': r2(k.trees), 'stroke-opacity': r2(1 - 0.6 * k.lights) };
  });
  for (const t of GROVE) {
    const s = t.s * stagger(k.trees, t.k, 8, 0.5);
    f[t.id] = { transform: `translate(${t.x},${t.y}) scale(${r2(s)})` };
  }
  RISK_SITES.forEach(([gx, gy], i) => {
    const p = graph(gx, gy);
    const resolved = input.risks[i] ?? 0;
    f[`risk${i}`] = { transform: `translate(${r1(p.x)},${r1(p.y)}) scale(${r2(px(9) * (0.5 + 0.5 * k.recapture) * (1 - 0.3 * resolved))})`, opacity: r2(k.recapture * (1 - 0.45 * resolved)) };
  });

  // --- Civic life: lanterns dim, shade spreads, common paths grow back ---
  const lampOp = r2(clamp(0.92 - k.lampDim - 0.3 * k.shadow) * (1 - 0.55 * day * (1 - k.lights)));
  f.lamps = { opacity: lampOp };
  f.L1lamps = { opacity: lampOp };
  f.L2lamps = { opacity: lampOp };
  f.shade = { opacity: r2(k.shadow * 0.95) };
  f.L3 = { 'stroke-opacity': r2(clamp(0.42 - 0.2 * k.shadow + 0.5 * k.paths)), 'stroke-width': r1(3.2 + 1.8 * k.paths) };
  f.skyGlow = { rx: r1(700 + 500 * day), ry: r1(260 + 160 * day), cy: r1(190 - 30 * day) };

  // --- Scene 12: the reader's line extends and waits ---
  {
    const to = villageCenter(1);
    const tip = mixPt(pos[READER], to, 0.86 * k.cta);
    f.cta = { d: `M${P(pos[READER])} L${P(tip)}`, opacity: r2(clamp(k.cta * 4)) };
    f.ctaRing = { transform: `translate(${r1(tip.x)},${r1(tip.y)}) scale(${r2(px(7))})`, opacity: r2(clamp(k.cta * 4)) };
  }

  // --- Demo overlays: hidden unless a demonstration is showing ---
  for (let i = 0; i < 6; i++) f[`hl${i}`] = { opacity: 0 };
  for (const id of ['gift', 'gift2', 'diamond', 'copyM', 'square', 'record', 'lblRecord', 'e01-04']) f[id] = { opacity: 0 };
  const mark = (id: string, p: Pt, sizePx: number, opacity = 1, rot = 0) => {
    f[id] = { transform: `translate(${r1(p.x)},${r1(p.y)}) scale(${r2(px(sizePx))})${rot ? ` rotate(${r1(rot)})` : ''}`, opacity: r2(opacity) };
  };
  const reveal = (i: number, d: string, p: number, reversed = false, opacity = 1) => {
    f[`hl${i}`] = { d, opacity: p > 0 ? opacity : 0, 'stroke-dasharray': reversed ? `0 ${r2(1 - p)} ${r2(p)} 1` : `${r2(p)} 1`, 'stroke-dashoffset': 0 };
  };
  const win = (ms: number, a: number, b: number) => ease(clamp((ms - a) / (b - a)));

  if (D) {
    const ms = D.ms;
    const fg = geom[FRIEND_EDGE];
    if (D.kind === 'send-open' || D.kind === 'send-freed') {
      const freed = D.kind === 'send-freed';
      const back0 = freed ? 1300 : 1400, back1 = freed ? 2200 : 2300;
      const p1 = win(ms, 0, 900), p2 = win(ms, back0, back1);
      reveal(0, edgeD(fg), p1);
      mark('gift', edgePoint(fg, p1), 4.4);
      f[`h${NODES[FRIEND].id}`] = { opacity: r2(clamp((ms - 900) / 200) * 0.9) };
      if (ms >= back0) {
        mark('gift2', edgePoint(fg, 1 - p2), 4.4);
        f[`h${NODES[READER].id}`] = { opacity: r2(p2 >= 1 ? 0.9 : 0) };
      }
      if (freed && ms >= 900) {
        const r = pos[READER];
        const o = clamp((ms - 900) / 400);
        const at = { x: r.x + px(34), y: r.y + px(14) };
        mark('record', at, 9, o);
        f.lblRecord = { x: r1(at.x + px(14)), y: r1(at.y + fs * 0.32), 'font-size': r1(fs), 'text-anchor': 'start', opacity: input.labels ? r2(o) : 0 };
      }
    } else if (D.kind === 'send-captured') {
      const a = win(ms, 0, 900), b = win(ms, 1800, 2300), c = win(ms, 2300, 2800);
      reveal(0, legD(fg, 0), a);
      reveal(1, legD(fg, 1), b);
      reveal(2, legD(fg, 2), c);
      const at = ms < 1800 ? legPoint(fg, 0, a) : ms < 2300 ? legPoint(fg, 1, b) : legPoint(fg, 2, c);
      mark('gift', at, 4.4);
      if (ms >= 900) mark('copyM', { x: fg.p[1].x - px(18), y: fg.p[1].y - px(20) }, 6.5, clamp((ms - 900) / 400));
      if (ms >= 1800) mark('diamond', { x: at.x + px(12), y: at.y - px(12) }, 5.4);
      if (c >= 1) f[`h${NODES[FRIEND].id}`] = { opacity: 0.9 };
    } else if (D.kind === 'send-alive') {
      const hops: [EdgeGeom, boolean, number, number][] = [
        [fg, false, 0, 900],
        [geom[edgeIndex(17, 23)], true, 1200, 2100],
        [geom[edgeIndex(12, 17)], true, 2100, 3000],
        [geom[edgeIndex(3, 12)], true, 3000, 3900],
        [edgeGeom(pos[TEMP_EDGE.a], pos[TEMP_EDGE.b], 1, 0, gates[0], gates[0]), true, 4900, 5800],
      ];
      let at = pos[READER], hop = 0;
      hops.forEach(([g, rev, t0, t1], i) => {
        const p = win(ms, t0, t1);
        if (i < 4) reveal(i, edgeD(g), p, rev, 0.8);
        else f['e01-04'] = { d: edgeD(g), opacity: p > 0 ? 0.8 : 0, 'stroke-width': 2, 'stroke-dasharray': `0 ${r2(1 - p)} ${r2(p)} 1` };
        if (ms >= t0) { at = edgePoint(g, rev ? 1 - p : p); hop = i; }
      });
      if (hop % 2 === 0) mark(hop === 2 ? 'gift2' : 'gift', at, hop === 2 ? 5.2 : 4.4);
      else mark('square', at, 4, 1, 45);
      if (ms >= 5800) f[`h${NODES[READER].id}`] = { opacity: 0.9 };
    } else if (D.kind === 'ripple-captured') {
      const n = D.node ?? 0;
      const ei = ADJ[n][0];
      const g = geom[ei];
      const fromA = EDGES[ei].a === n;
      const p = win(ms, 0, 900);
      reveal(0, legD(g, fromA ? 0 : 2), p, !fromA);
      mark('gift', fromA ? legPoint(g, 0, p) : legPoint(g, 2, 1 - p), 3.4);
      f[`h${NODES[n].id}`] = { opacity: r2(bump(ms / 500)) };
    } else if (D.kind === 'scope') {
      const g = D.group ?? 0;
      const first = g * 6;
      if (D.scope === 0) {
        const ei = ADJ[first].find((x) => EDGES[x].kind === 'bridge')!;
        const fromA = EDGES[ei].a === first;
        const p = win(ms, 0, 1200);
        reveal(0, edgeD(geom[ei]), p, !fromA);
        mark('gift', edgePoint(geom[ei], fromA ? p : 1 - p), 3.4);
      } else if (D.scope === 1) {
        const hopN = Math.min(5, Math.floor(ms / 400));
        const p = ms >= 2400 ? 1 : win(ms, hopN * 400, hopN * 400 + 400);
        const a = first + hopN, b = first + ((hopN + 1) % 6);
        const ei = edgeIndex(a, b);
        const fromA = EDGES[ei].a === a;
        const s = fromA ? p : 1 - p;
        f.hl0 = { d: edgeD(geom[ei]), opacity: 1, 'stroke-dasharray': '0.07 0.05 0.07 0.05 0.07 2', 'stroke-dashoffset': r2(fromA ? -(s - 0.31) : -s) };
        mark('gift', edgePoint(geom[ei], s), 3.4);
      } else {
        mark('square', { x: pos[first].x, y: pos[first].y }, 9 + 3 * bump(ms / 600));
      }
    }
  }

  return { frame: f, ctx: { k, uppEff, pos, geom, gates, towers } };
};

/** Bounded moving marks: at most six amber extraction beads and three reciprocal pulses. */
export const ambientFrame = (ctx: FrameContext, phase: AmbientPhase | null): Frame => {
  const f: Frame = {};
  const { k, uppEff } = ctx;
  const flow = k.extract * (1 - k.seams) * k.platform;
  for (let i = 0; i < 6; i++) {
    const t = ctx.towers[i % 3];
    let p = -1;
    if (flow > 0.02) p = phase ? ((((phase.ext - i) % 6) + 6) % 6) / 3 : i < 3 ? 0.3 + 0.25 * i : -1;
    if (p < 0 || p >= 1) { f[`xb${i}`] = { opacity: 0 }; continue; }
    const y = lerp(t.yBase + 4, t.yRes, p);
    f[`xb${i}`] = {
      transform: `translate(${r1(t.x + (i % 2 ? 1.5 : -1.5) * uppEff)},${r1(y)}) scale(${r2(3.4 * uppEff)})`,
      opacity: r2(clamp(flow * 1.6) * smooth(clamp(p * 8)) * smooth(clamp((1 - p) * 8))),
    };
  }
  const peer = clamp(1 - 0.9 * k.extract);
  for (let j = 0; j < 3; j++) {
    if (!phase) { f[`rb${j}`] = { opacity: 0 }; continue; }
    const c = phase.rec - j;
    const n = Math.floor(c / 3);
    const p = (c - n * 3) / 2.4;
    const ei = (((n * 3 + j) * 2654435761) >>> 0) % 36;
    const g = ctx.geom[ei];
    if (c < 0 || p >= 1 || g.r > 0.05 || peer < 0.05) { f[`rb${j}`] = { opacity: 0 }; continue; }
    const s = p < 0.5 ? ease(p * 2) : ease(2 - p * 2);
    const at = edgePoint(g, s);
    f[`rb${j}`] = { transform: `translate(${r1(at.x)},${r1(at.y)}) scale(${r2(3 * uppEff)})`, opacity: r2(peer * smooth(clamp(p * 10)) * smooth(clamp((1 - p) * 10))) };
  }
  const off = phase ? r1(-phase.rib * 24) : 0;
  f['rbA-t'] = { 'stroke-dashoffset': off };
  f['rbB-t'] = { 'stroke-dashoffset': r1(off * 1.15) };
  f['rbC-t'] = { 'stroke-dashoffset': r1(off * 0.9) };
  return f;
};

/** Counts that must stay bounded and stable for the whole film. */
export const census = () => ({ people: NODES.length, relationships: EDGES.length, segments: TOWERS.length * 8, towers: TOWERS.length });
