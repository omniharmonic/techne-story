// The static illustrated world: every element that exists for the whole film.
// Nothing is created or destroyed after this; frame.ts only changes attributes.
//
// Layer order (back to front): distant mountains, haze, far hills, terrain and
// river, civic landmarks, tower/commons segments, relationship routes, people,
// foreground vegetation, labels.

import {
  EDGES, HOMES, NODES, RISK_SITES, RIVER, SEG_DEST, TOWERS, VILLAGES, LANDMARKS,
  ground, openPos, towerBase, villageCenter, type Pt,
} from './data.ts';
import { h, r1, rng, type SvgNode } from './svg.ts';

// --- Palette -------------------------------------------------------------------
// [night, day] or [night, dawn, day]. frame.ts interpolates these onto gradient
// stops, so one attribute change relights every shape that shares the gradient.

export const STOPS: Record<string, string[]> = {
  sky0: ['#06161E', '#2B4A5E', '#7FAEC0'],
  sky1: ['#0D2630', '#4E6E86', '#B9D6D0'],
  sky2: ['#1C434D', '#E3A982', '#F3DDB9'],
  glow0: ['#3F7480', '#F2C59A', '#FFF1D2'],
  mtF0: ['#1D434D', '#6F8C96', '#A9C3C2'],
  mtF1: ['#19414A', '#A9A69A', '#CFD9C6'],
  mtN0: ['#12303A', '#4C6F74', '#7FA19C'],
  mtN1: ['#17404A', '#7F9088', '#A8BFA6'],
  hill0: ['#12333B', '#55795F', '#86A57C'],
  hill1: ['#173C41', '#6F8C68', '#A3B885'],
  gnd0: ['#214B4D', '#6F9470', '#9DB27B'],
  gnd1: ['#173C3A', '#4F7558', '#6F9562'],
  gnd2: ['#0C2629', '#2F5347', '#4A7052'],
  mdT0: ['#30645D', '#86A876', '#BACB8B'],
  mdT1: ['#1B4544', '#557E5E', '#7FA568'],
  mdS0: ['#102C31', '#5F6A58', '#8E8769'],
  mdS1: ['#081C25', '#35483F', '#5E6550'],
  riv0: ['#3F7C88', '#B9CFC4', '#DCEFE8'],
  riv1: ['#1B4652', '#5F97A0', '#9AC6C3'],
  bank: ['#0A2228', '#3F5A4C', '#6F7B5C'],
  tr0: ['#1B4A44', '#4F8259', '#6C9C62'],
  tr1: ['#0A2326', '#24503E', '#356649'],
  rt0: ['#2F5E4E', '#7FAE6C', '#A2C878'],
  rt1: ['#143A33', '#3F7A4F', '#5C9257'],
  fg0: ['#071A1E', '#16382F', '#27503C'],
  hut0: ['#2D4F4F', '#B5A88C', '#EADDC0'],
  hutS: ['#1C3638', '#7F745F', '#B9AB8D'],
  hut1: ['#1A3437', '#8E6F58', '#BC8560'],
  stone: ['#35585A', '#A39B84', '#D8CDB2'],
  trail: ['#4E6F6A', '#C9BE9F', '#F0E4C4'],
};

export const riverPts: { x: number; y: number; w: number }[] = [];

const catmull = (p: Pt[], n: number): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(p[p.length - 1]);
  return out;
};

{
  const ext: [number, number][] = [[0.5, -0.02], ...RIVER, [0.33, 1.3], [0.2, 1.9]];
  for (const p of catmull(ext.map(([u, v]) => ground(u, v)), 14)) {
    const v = (p.y - 255) / 560;
    riverPts.push({ x: p.x, y: p.y, w: 6 + 34 * Math.pow(Math.max(0, v), 1.15) });
  }
}

export const riverAt = (y: number) => {
  for (let i = 1; i < riverPts.length; i++) {
    const a = riverPts[i - 1], b = riverPts[i];
    if (y <= b.y && y >= a.y) {
      const t = (y - a.y) / (b.y - a.y || 1);
      return { x: a.x + (b.x - a.x) * t, w: a.w + (b.w - a.w) * t };
    }
  }
  return null;
};

const pts = (list: Pt[]) => list.map((p) => `${r1(p.x)},${r1(p.y)}`).join(' L');

const ridge = (rand: () => number, base: number, amp: number, step: number) => {
  const p1 = rand() * 6.28, p2 = rand() * 6.28, p3 = rand() * 6.28;
  const P: Pt[] = [];
  for (let x = -1500; x <= 2300; x += step) {
    const m = 1 - Math.abs(Math.sin(x * 0.0047 + p1));
    const m2 = 1 - Math.abs(Math.sin(x * 0.0113 + p2));
    const m3 = Math.sin(x * 0.031 + p3) * 0.5 + 0.5;
    P.push({ x, y: base - amp * (0.6 * Math.pow(m, 1.4) + 0.3 * m2 + 0.1 * m3) });
  }
  let d = `M-1500,${base + 80} L${r1(P[0].x)},${r1(P[0].y)}`;
  for (let i = 1; i < P.length - 1; i++) {
    const mx = (P[i].x + P[i + 1].x) / 2, my = (P[i].y + P[i + 1].y) / 2;
    d += ` Q${r1(P[i].x)},${r1(P[i].y)} ${r1(mx)},${r1(my)}`;
  }
  return d + ` L2300,${base + 80}Z`;
};

const stop = (id: string, offset: number, opacity?: number) =>
  h('stop', { id, offset, 'stop-color': STOPS[id][0], ...(opacity !== undefined ? { 'stop-opacity': opacity } : {}) });

const lin = (id: string, x1: number, y1: number, x2: number, y2: number, stops: SvgNode[], user = false) =>
  h('linearGradient', { id, x1, y1, x2, y2, ...(user ? { gradientUnits: 'userSpaceOnUse' } : {}) }, ...stops);

const fixedStop = (offset: number, color: string, opacity = 1) => h('stop', { offset, 'stop-color': color, 'stop-opacity': opacity });

const defs = (): SvgNode =>
  h('defs', {},
    lin('gPlateFadeY', 0, -24, 0, 876, [fixedStop(0, '#FFFFFF', 0), fixedStop(0.12, '#FFFFFF'), fixedStop(0.94, '#FFFFFF'), fixedStop(1, '#FFFFFF', 0)], true),
    lin('gPlateFadeX', -70, 0, 1040, 0, [fixedStop(0, '#FFFFFF', 0), fixedStop(0.055, '#FFFFFF'), fixedStop(0.955, '#FFFFFF'), fixedStop(1, '#FFFFFF', 0)], true),
    h('mask', { id: 'plateFadeY', maskUnits: 'userSpaceOnUse', x: -70, y: -24, width: 1110, height: 900 }, h('rect', { x: -70, y: -24, width: 1110, height: 900, fill: 'url(#gPlateFadeY)' })),
    h('mask', { id: 'plateFadeX', maskUnits: 'userSpaceOnUse', x: -70, y: -24, width: 1110, height: 900 }, h('rect', { x: -70, y: -24, width: 1110, height: 900, fill: 'url(#gPlateFadeX)' })),
    lin('gSky', 0, -500, 0, 262, [stop('sky0', 0), stop('sky1', 0.6), stop('sky2', 1)], true),
    h('radialGradient', { id: 'gGlow', cx: 0.5, cy: 0.5, r: 0.5 },
      h('stop', { id: 'glow0', offset: 0, 'stop-color': STOPS.glow0[0], 'stop-opacity': 0.55 }),
      h('stop', { id: 'glow1', offset: 1, 'stop-color': STOPS.glow0[0], 'stop-opacity': 0 })),
    lin('gHaze', 0, 0, 0, 1, [h('stop', { id: 'haze0', offset: 0, 'stop-color': STOPS.sky2[0], 'stop-opacity': 0 }), h('stop', { offset: 0.42, id: 'haze1', 'stop-color': STOPS.sky2[0], 'stop-opacity': 0.5 }), h('stop', { id: 'haze2', offset: 1, 'stop-color': STOPS.sky2[0], 'stop-opacity': 0 })]),
    lin('gMtF', 0, 0, 0, 1, [stop('mtF0', 0), stop('mtF1', 1)]),
    lin('gMtN', 0, 0, 0, 1, [stop('mtN0', 0), stop('mtN1', 1)]),
    lin('gHill', 0, 0, 0, 1, [stop('hill1', 0), stop('hill0', 1)]),
    lin('gGround', 0, 250, 0, 900, [stop('gnd0', 0), stop('gnd1', 0.42), stop('gnd2', 1)], true),
    lin('gMoundTop', 0, 0, 1, 1, [stop('mdT0', 0), stop('mdT1', 1)]),
    lin('gMoundSide', 0, 0, 0, 1, [stop('mdS0', 0), stop('mdS1', 1)]),
    lin('gRiver', 0, 250, 0, 900, [stop('riv0', 0), stop('riv1', 1)], true),
    lin('gBank', 0, 0, 0, 1, [stop('bank', 0)]),
    lin('gTree', 0, 0, 1, 0, [stop('tr0', 0), stop('tr1', 0.75)]),
    lin('gRound', 0, 0, 1, 1, [stop('rt0', 0), stop('rt1', 1)]),
    lin('gFg', 0, 0, 0, 1, [stop('fg0', 0)]),
    lin('gHut', 0, 0, 1, 0, [stop('hut0', 0), stop('hutS', 1)]),
    lin('gHutRoof', 0, 0, 0, 1, [stop('hut1', 0)]),
    lin('gStone', 0, 0, 0, 1, [stop('stone', 0)]),
    lin('gTrail', 0, 0, 0, 1, [stop('trail', 0)]),
    // Tower / commons material: one gradient relights all 24 segments.
    lin('gSeg', 0, 0, 1, 0, [
      h('stop', { id: 'seg0', offset: 0, 'stop-color': '#4A7068' }),
      h('stop', { id: 'seg1', offset: 0.34, 'stop-color': '#213F3F' }),
      h('stop', { id: 'seg2', offset: 1, 'stop-color': '#0B1D22' }),
    ]),
    lin('gSegDoor', 0, 0, 0, 1, [h('stop', { id: 'segD', offset: 0, 'stop-color': '#061317' })]),
    lin('gWin', 0, 0, 0, 1, [h('stop', { id: 'win', offset: 0, 'stop-color': '#B58A4F', 'stop-opacity': 0.45 })]),
    lin('gRoof', 0, 0, 1, 1, [fixedStop(0, '#9DBF78'), fixedStop(1, '#5E8F5A')]),
    lin('gRoofB', 0, 0, 1, 1, [fixedStop(0, '#D9A277'), fixedStop(1, '#B4744F')]),
    lin('gAmber', 0, 1, 0, 0, [fixedStop(0, '#C98F3F'), fixedStop(0.6, '#E9BC67'), fixedStop(1, '#FFE3A1')]),
    lin('gChannel', 0, 1, 0, 0, [fixedStop(0, '#E9BC67', 0.15), fixedStop(0.25, '#E9BC67', 0.9), fixedStop(1, '#F6D48B', 1)]),
    h('radialGradient', { id: 'gShade' }, fixedStop(0, '#040F14', 0.82), fixedStop(0.6, '#040F14', 0.55), fixedStop(1, '#040F14', 0)),
    h('radialGradient', { id: 'gHaloC' }, fixedStop(0, '#E7AE74', 0.5), fixedStop(1, '#E7AE74', 0)),
    h('radialGradient', { id: 'gHaloS' }, fixedStop(0, '#F1EBDD', 0.55), fixedStop(1, '#A9D3B1', 0)),
    h('radialGradient', { id: 'gHaloI' }, fixedStop(0, '#F1EBDD', 0.7), fixedStop(1, '#F1EBDD', 0)),
    h('radialGradient', { id: 'gAmberGlow' }, fixedStop(0, '#E9BC67', 0.5), fixedStop(1, '#E9BC67', 0)),
    h('radialGradient', { id: 'gSun' }, fixedStop(0, '#FFE9B8', 0.5), fixedStop(1, '#FFE9B8', 0)),
    // Reusable motifs.
    h('symbol', { id: 'conifer', overflow: 'visible' },
      h('path', { d: 'M0,-32 C3,-24 6,-18 8.5,-11 L5,-11.5 C8,-6.5 9.5,-3 10.5,1.5 L1.4,1 L1.4,4 L-1.4,4 L-1.4,1 L-10.5,1.5 C-9.5,-3 -8,-6.5 -5,-11.5 L-8.5,-11 C-6,-18 -3,-24 0,-32Z', fill: 'url(#gTree)' })),
    h('symbol', { id: 'coniferFg', overflow: 'visible' },
      h('path', { d: 'M0,-32 C3,-24 6,-18 8.5,-11 L5,-11.5 C8,-6.5 9.5,-3 10.5,1.5 L1.4,1 L1.4,6 L-1.4,6 L-1.4,1 L-10.5,1.5 C-9.5,-3 -8,-6.5 -5,-11.5 L-8.5,-11 C-6,-18 -3,-24 0,-32Z', fill: 'url(#gFg)' })),
    h('symbol', { id: 'roundTree', overflow: 'visible' },
      h('path', { d: 'M-1.2,0 L-1.2,-7 L1.2,-7 L1.2,0Z', fill: '#4A3A2C' }),
      h('path', { d: 'M-9,-9 C-12,-14 -9,-20 -4,-20 C-3,-25 5,-26 7,-21 C12,-21 13,-14 10,-10 C8,-5 -6,-5 -9,-9Z', fill: 'url(#gRound)' }),
      h('path', { d: 'M-8,-16 Q-7,-21 -3,-19 Q0,-25 5,-20 Q-1,-20 -2,-15Z', fill: '#D0DF99', opacity: 0.28 }),
      h('path', { d: 'M2,-6 Q10,-5 11,-12 Q5,-9 2,-6Z', fill: '#1C4F39', opacity: 0.3 })),
    h('symbol', { id: 'blossomTree', overflow: 'visible' },
      h('path', { d: 'M-1.2,0 L-1.2,-7 L1.2,-7 L1.2,0Z', fill: '#4A3A2C' }),
      h('path', { d: 'M-9,-9 C-12,-14 -9,-20 -4,-20 C-3,-25 5,-26 7,-21 C12,-21 13,-14 10,-10 C8,-5 -6,-5 -9,-9Z', fill: '#E9B9A6' }),
      h('path', { d: 'M-2,-9 C-5,-13 -2,-18 2,-17 C7,-18 9,-13 6,-10 C4,-7 0,-7 -2,-9Z', fill: '#F6D5C4', opacity: 0.8 })),
    h('symbol', { id: 'hut', overflow: 'visible' },
      h('path', { d: 'M-7,0 L-7,-7 Q-7,-9 -5,-9 L5,-9 Q7,-9 7,-7 L7,0Z', fill: 'url(#gHut)' }),
      h('path', { d: 'M-9,-8 Q0,-17 9,-8 Q0,-10.5 -9,-8Z', fill: 'url(#gHutRoof)' }),
      h('rect', { x: -1.6, y: -6.2, width: 3.2, height: 4, fill: 'url(#gWin)' })),
  );

// A sculpted plateau: lit top face plus a darker cliff face beneath it.
const mound = (cx: number, cy: number, rx: number, ry: number, hgt: number): SvgNode[] => [
  h('path', {
    d: `M${cx - rx},${cy} L${cx - rx},${cy + hgt} A${rx},${ry} 0 0 0 ${cx + rx},${cy + hgt} L${cx + rx},${cy} A${rx},${ry} 0 0 1 ${cx - rx},${cy}Z`,
    fill: 'url(#gMoundSide)',
  }),
  h('ellipse', { cx, cy, rx, ry, fill: 'url(#gMoundTop)' }),
  h('path', {
    d: `M${cx - rx * 0.96},${r1(cy - ry * 0.25)} A${rx},${ry} 0 0 1 ${r1(cx + rx * 0.3)},${r1(cy - ry * 0.95)}`,
    fill: 'none', stroke: '#F1EBDD', 'stroke-opacity': 0.12, 'stroke-width': 1.2,
  }),
];

const VILLAGE_MOUND = { rx: 122, ry: 76, h: 18 };

// Unit architectural segment: 100 wide, 100 tall, base centred on the origin.
// The seams drawn here are the ones that stay recognizable from megalith to commons.
const segment = (id: string, alt: boolean): SvgNode =>
  h('g', { id, class: 'seg' },
    h('path', { d: 'M-50,0 C-52,-24 -45,-42 -46,-66 C-47,-89 -35,-101 -19,-102 L22,-101 C39,-98 48,-85 47,-66 C46,-43 54,-20 50,0Z', fill: 'url(#gSeg)' }),
    h('path', { d: 'M-46,-3 C-43,-31 -37,-52 -36,-70 Q-35,-94 -19,-99 L-11,-99 C-24,-77 -23,-43 -28,-4Z', fill: '#91B9A0', opacity: 0.12 }),
    h('path', { d: 'M29,-95 C43,-74 36,-40 47,-4 L35,-2 C27,-31 31,-62 23,-96Z', fill: '#06161A', opacity: 0.25 }),
    h('path', { d: 'M-48,-70 Q-48,-97 -24,-98', fill: 'none', stroke: '#F1EBDD', 'stroke-opacity': 0.22, 'stroke-width': 1.2, 'vector-effect': 'non-scaling-stroke' }),
    h('path', { d: 'M-22,-99 C-29,-70 -16,-42 -22,0 M26,-98 C18,-71 32,-34 26,0', fill: 'none', stroke: '#04090B', 'stroke-opacity': 0.42, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }),
    h('path', { d: 'M-48,-13 Q-26,-17 -12,-13 M12,-25 Q28,-29 46,-23 M-38,-77 L-29,-80', fill: 'none', stroke: '#A2BEA9', 'stroke-opacity': 0.14, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }),
    h('path', { d: 'M-9,0 L-9,-36 Q-9,-50 0,-50 Q9,-50 9,-36 L9,0Z', fill: 'url(#gSegDoor)' }),
    h('rect', { x: -38, y: -62, width: 7, height: 16, fill: 'url(#gWin)' }),
    h('rect', { x: 34, y: -58, width: 6, height: 14, fill: 'url(#gWin)' }),
    h('path', { id: `${id}r`, d: 'M-58,-72 Q-56,-108 0,-122 Q56,-108 58,-72 Q0,-86 -58,-72Z', fill: alt ? 'url(#gRoofB)' : 'url(#gRoof)', opacity: 0 }),
  );

const bead = (i: number): SvgNode => {
  const special = i === 0 || i === 23;
  const fills = ['#E7AE74', '#EFC38F', '#DE9C62', '#EBB98A'];
  const kids: SvgNode[] = [
    h('circle', { id: `h${NODES[i].id}`, r: 3.4, fill: 'url(#gHaloI)', opacity: 0 }),
    h('circle', { r: 2.5, fill: i === 23 ? 'url(#gHaloS)' : 'url(#gHaloC)' }),
    h('circle', { r: 1.22, fill: '#081C25', opacity: 0.55 }),
    h('circle', { r: 1, fill: i === 23 ? '#A9D3B1' : fills[i % 4] }),
    h('circle', { cx: -0.3, cy: -0.32, r: 0.34, fill: '#FFF7E6', opacity: 0.55 }),
  ];
  if (i === 0) {
    kids.unshift(h('circle', { class: 'hit', r: 2.8, fill: 'transparent' }));
    kids.push(h('circle', { r: 1.62, fill: 'none', stroke: '#E7AE74', 'stroke-width': 1.6, 'vector-effect': 'non-scaling-stroke' }));
    kids.push(h('circle', { r: 2.15, fill: 'none', stroke: '#E7AE74', 'stroke-width': 1.2, 'stroke-opacity': 0.8, 'vector-effect': 'non-scaling-stroke' }));
  }
  if (i === 23) kids.push(h('circle', { r: 1.62, fill: 'none', stroke: '#F1EBDD', 'stroke-width': 1.8, 'vector-effect': 'non-scaling-stroke' }));
  return h('g', { id: NODES[i].id, class: special ? 'person special' : 'person' }, ...kids);
};

const label = (id: string, text: string): SvgNode =>
  h('text', {
    id, class: 'wl', 'font-family': 'Newsreader, Georgia, serif', fill: '#F1EBDD', stroke: '#081C25',
    'stroke-width': 3, 'stroke-opacity': 0.85, 'paint-order': 'stroke', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke', opacity: 0,
  }, text);

const glyphStroke = { fill: '#0B2228', 'fill-opacity': 0.82, stroke: '#F1EBDD', 'stroke-width': 1.4, 'vector-effect': 'non-scaling-stroke', 'stroke-linejoin': 'round' };
const glyphLine = { fill: 'none', stroke: '#F1EBDD', 'stroke-width': 1.2, 'vector-effect': 'non-scaling-stroke', 'stroke-linecap': 'round' };

// Glyphs are drawn in a 2-unit box and scaled to screen size by frame.ts.
const homeGlyph = (id: string) =>
  h('g', { id, opacity: 0 },
    h('path', { d: 'M-1,0.9 L-1,-0.25 L0,-1.1 L1,-0.25 L1,0.9Z', ...glyphStroke, 'fill-opacity': 0.6, stroke: '#A9D3B1' }),
    h('path', { d: 'M-0.3,0.9 L-0.3,0.2 L0.3,0.2 L0.3,0.9', ...glyphLine, stroke: '#A9D3B1' }));

const functionGlyph = (id: string, kind: number) => {
  const box = h('rect', { x: -1, y: -0.8, width: 2, height: 1.6, rx: 0.3, ...glyphStroke });
  const inner = [
    h('path', { d: 'M-0.55,-0.25 h0.01 M-0.1,-0.25 L0.6,-0.25 M-0.55,0.3 L0.6,0.3', ...glyphLine }),
    h('path', { d: 'M-0.55,-0.35 L0.55,-0.35 M-0.55,0 L0.55,0 M-0.55,0.35 L0.2,0.35', ...glyphLine }),
    h('path', { d: 'M0.1,-0.05 m-0.42,0 a0.42,0.42 0 1 0 0.84,0 a0.42,0.42 0 1 0 -0.84,0 M-0.2,0.25 L-0.55,0.55', ...glyphLine }),
    h('path', { d: 'M-0.6,-0.4 L0.6,-0.4 L0.6,0.4 L-0.6,0.4Z M0,-0.4 L0,0.4', ...glyphLine }),
  ][kind];
  return h('g', { id, opacity: 0 }, box, inner);
};

/** Village groves that rise during the blossoming; positions are fixed for the whole film. */
export const GROVE: { id: string; g: number; k: number; x: number; y: number; s: number; blossom: boolean }[] = [];
{
  const sites: [number, number, number, boolean][] = [
    [-104, -34, 1.5, false], [-86, -58, 1.3, false], [-30, -78, 1.25, true], [34, -80, 1.3, false],
    [92, -52, 1.45, false], [112, -14, 1.6, true], [-112, 22, 1.7, false], [96, 46, 1.75, false],
  ];
  VILLAGES.forEach((v, g) => {
    const c = villageCenter(g);
    sites.forEach(([dx, dy, s, blossom], k) =>
      GROVE.push({ id: `vt${g}-${k}`, g, k, x: r1(c.x + dx), y: r1(c.y + dy), s: r1(s * (0.75 + 0.4 * v.v)), blossom }));
  });
}

export interface TerrainPlates { night: string; day?: string }
const assetBase = (import.meta as ImportMeta & { env?: { BASE_URL: string } }).env?.BASE_URL ?? '/techne-story/';
export const buildWorld = (plates: TerrainPlates = { night: `${assetBase}art/terrain-night.webp`, day: `${assetBase}art/terrain-day.webp` }): SvgNode => {
  const rand = rng(20261006);

  // --- Distant plane ---
  const far = h('g', { id: 'pFar', opacity: 0 },
    h('rect', { x: -4000, y: -6000, width: 9000, height: 6300, fill: 'url(#gSky)' }),
    h('ellipse', { id: 'skyGlow', cx: 760, cy: 190, rx: 700, ry: 260, fill: 'url(#gGlow)' }),
    h('path', { d: ridge(rand, 236, 150, 46), fill: 'url(#gMtF)' }),
    h('path', { d: ridge(rand, 252, 96, 38), fill: 'url(#gMtN)' }),
    h('path', { d: ridge(rand, 266, 34, 30), fill: 'url(#gHill)' }),
    h('rect', { x: -4000, y: 196, width: 9000, height: 170, fill: 'url(#gHaze)' }),
  );

  // --- Terrain ---
  const terrain: SvgNode[] = [h('rect', { x: -4000, y: 254, width: 9000, height: 6000, fill: 'url(#gGround)' })];

  // Broad rolling swells give the ground form before any detail is added.
  const swells: [number, number, number, number][] = [
    [-260, 380, 420, 70], [200, 330, 300, 46], [760, 320, 330, 44], [1180, 420, 360, 70],
    [-420, 640, 460, 110], [360, 600, 340, 80], [900, 660, 380, 90], [120, 880, 520, 110], [820, 900, 520, 110],
  ];
  for (const [cx, cy, rx, ry] of swells) {
    terrain.push(h('ellipse', { cx, cy, rx, ry, fill: 'url(#gMoundTop)', opacity: 0.32 }));
  }

  const decor: [number, number, number, number, number][] = [
    [-330, 470, 210, 70, 20], [70, 395, 150, 44, 14], [250, 325, 120, 32, 10], [-140, 600, 190, 66, 20],
    [150, 842, 200, 72, 22], [-430, 800, 260, 90, 26], [955, 322, 105, 30, 10], [1150, 520, 190, 62, 18],
    [960, 790, 150, 58, 18], [1320, 740, 220, 80, 22], [40, 690, 96, 38, 12], [690, 304, 86, 22, 8],
  ];
  const mounds = [...decor];
  for (const v of VILLAGES) {
    const c = ground(v.u, v.v);
    mounds.push([c.x, c.y + 4, VILLAGE_MOUND.rx * (0.82 + 0.3 * v.v), VILLAGE_MOUND.ry * (0.82 + 0.3 * v.v), VILLAGE_MOUND.h]);
  }
  mounds.sort((a, b) => a[1] - b[1]);

  // River: bank first, then water, then a few reflective strokes.
  const left = riverPts.map((p) => ({ x: p.x - p.w, y: p.y }));
  const right = riverPts.map((p) => ({ x: p.x + p.w, y: p.y })).reverse();
  const bankL = riverPts.map((p) => ({ x: p.x - p.w - 5 - p.w * 0.12, y: p.y + 3 }));
  const bankR = riverPts.map((p) => ({ x: p.x + p.w + 4 + p.w * 0.1, y: p.y + 5 })).reverse();
  const river = h('g', { id: 'river' },
    h('path', { d: `M${pts(bankL)} L${pts(bankR)}Z`, fill: 'url(#gBank)' }),
    h('path', { d: `M${pts(left)} L${pts(right)}Z`, fill: 'url(#gRiver)' }),
    h('path', { id: 'riverGlint', d: `M${pts(riverPts.filter((_, i) => i % 2 === 0).map((p) => ({ x: p.x - p.w * 0.35, y: p.y })))}`, fill: 'none', stroke: '#F1EBDD', 'stroke-opacity': 0.16, 'stroke-width': 1.4, 'stroke-dasharray': '26 38', 'stroke-linecap': 'round' }),
    h('path', { d: `M${pts(riverPts.filter((_, i) => i % 2 === 1).map((p) => ({ x: p.x + p.w * 0.4, y: p.y })))}`, fill: 'none', stroke: '#F1EBDD', 'stroke-opacity': 0.1, 'stroke-width': 1.2, 'stroke-dasharray': '14 52', 'stroke-linecap': 'round' }),
  );

  for (const m of mounds.filter((m) => m[1] < 400)) terrain.push(...mound(...m));
  terrain.push(river);
  for (const m of mounds.filter((m) => m[1] >= 400)) terrain.push(...mound(...m));

  // --- L3 common paths, the existing bridge, L1 library and L2 assembly circle ---
  const vc = VILLAGES.map((_, g) => villageCenter(g));
  const trail = catmull([vc[0], { x: 372, y: 560 }, vc[1], { x: 512, y: 536 }, vc[2], { x: 760, y: 560 }, vc[3]], 10);
  const civic: SvgNode[] = [
    h('path', { id: 'L3', d: `M${pts(trail)}`, fill: 'none', stroke: 'url(#gTrail)', 'stroke-width': 3.2, 'stroke-opacity': 0.4, 'stroke-linecap': 'round', 'stroke-dasharray': '1 0' }),
    h('g', { id: 'bridge0', transform: 'translate(512,536) rotate(24)' },
      h('path', { d: 'M-34,2 Q0,-15 34,2 L34,8 Q0,-6 -34,8Z', fill: 'url(#gStone)' }),
      h('path', { d: 'M-34,2 Q0,-15 34,2', fill: 'none', stroke: '#F1EBDD', 'stroke-opacity': 0.25, 'stroke-width': 1 })),
  ];
  const L1 = ground(LANDMARKS.L1.u, LANDMARKS.L1.v);
  const L2 = ground(LANDMARKS.L2.u, LANDMARKS.L2.v);
  civic.push(
    h('g', { id: 'L1', transform: `translate(${r1(L1.x)},${r1(L1.y)})` },
      h('ellipse', { cx: 0, cy: 3, rx: 34, ry: 9, fill: 'url(#gStone)', opacity: 0.55 }),
      h('path', { d: 'M-24,2 L-24,-14 L24,-14 L24,2Z', fill: 'url(#gHut)' }),
      h('path', { d: 'M-28,-13 Q-20,-30 0,-32 Q20,-30 28,-13 Q0,-18 -28,-13Z', fill: 'url(#gHutRoof)' }),
      h('path', { d: 'M-16,2 L-16,-12 M-6,2 L-6,-12 M6,2 L6,-12 M16,2 L16,-12', stroke: '#081C25', 'stroke-opacity': 0.4, 'stroke-width': 1.4 }),
      h('g', { id: 'L1lamps' },
        h('rect', { x: -13, y: -10, width: 4, height: 7, fill: '#F2CC8B' }),
        h('rect', { x: -2, y: -10, width: 4, height: 7, fill: '#F2CC8B' }),
        h('rect', { x: 9, y: -10, width: 4, height: 7, fill: '#F2CC8B' }))),
    h('g', { id: 'L2', transform: `translate(${r1(L2.x)},${r1(L2.y)})` },
      h('ellipse', { cx: 0, cy: 0, rx: 30, ry: 12, fill: 'url(#gStone)', opacity: 0.4 }),
      h('ellipse', { cx: 0, cy: 0, rx: 22, ry: 8.5, fill: 'none', stroke: 'url(#gStone)', 'stroke-width': 3 }),
      ...Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + 0.3;
        return h('rect', { x: r1(Math.cos(a) * 28 - 2.5), y: r1(Math.sin(a) * 11 - 5), width: 5, height: 6, rx: 2, fill: 'url(#gHut)' });
      }),
      h('g', { id: 'L2lamps' }, h('rect', { x: -2, y: -7, width: 4, height: 7, fill: '#F2CC8B' }))),
  );
  // Lanterns along the common paths (rectangular, never round, so they cannot be read as people).
  const lamps = h('g', { id: 'lamps' }, ...[8, 22, 34, 46, 56].map((i) =>
    h('rect', { x: r1(trail[i].x - 1.5), y: r1(trail[i].y - 9), width: 3, height: 5, fill: '#F2CC8B' })));

  // Huts that exist from the first frame: the same places throughout.
  const huts: SvgNode[] = [];
  const hutSites: [number, number, number][] = [];
  for (const c of vc) hutSites.push([c.x - 26, c.y - 10, 1.2], [c.x + 24, c.y - 14, 1.1]);
  hutSites.push([60, 392, 0.9], [84, 396, 0.8], [150, 836, 1.5], [-150, 596, 1.2], [958, 320, 0.8], [962, 784, 1.4], [246, 322, 0.8]);
  hutSites.sort((a, b) => a[1] - b[1]);
  for (const [x, y, s] of hutSites) huts.push(h('use', { href: '#hut', transform: `translate(${r1(x)},${r1(y)}) scale(${s})` }));

  // --- Trees: deterministic scatter that keeps clear of river, towers and people ---
  const blocked = (x: number, y: number) => {
    const r = riverAt(y);
    if (r && Math.abs(x - r.x) < r.w + 16) return true;
    for (let t = 0; t < 3; t++) {
      const b = towerBase(t);
      if (Math.abs(x - b.x) < TOWERS[t].wLow * 0.62 && y > b.y - 40 && y < b.y + 26) return true;
    }
    for (const c of vc) if (((x - c.x) / 104) ** 2 + ((y - c.y) / 62) ** 2 < 1) return true;
    for (let i = 0; i < 24; i++) {
      const p = openPos(i);
      if (Math.hypot(x - p.x, y - p.y) < 20) return true;
    }
    if (Math.hypot(x - L1.x, y - L1.y) < 44 || Math.hypot(x - L2.x, y - L2.y) < 44) return true;
    return false;
  };
  const trees: { x: number; y: number; s: number }[] = [];
  const clusters: [number, number, number, number, number][] = [
    [-520, 520, 26, 260, 180], [-180, 720, 22, 200, 110], [40, 520, 12, 110, 70], [180, 440, 9, 80, 40],
    [330, 560, 7, 60, 40], [400, 800, 9, 90, 40], [620, 420, 8, 60, 40], [760, 640, 8, 70, 40],
    [930, 520, 10, 60, 90], [1150, 640, 22, 180, 160], [560, 300, 10, 240, 22], [120, 300, 10, 220, 20],
    [900, 290, 8, 160, 18], [240, 700, 6, 60, 50], [880, 800, 9, 90, 40], [520, 840, 6, 70, 22],
  ];
  for (const [cx, cy, n, sx, sy] of clusters) {
    for (let i = 0; i < n; i++) {
      const x = cx + (rand() + rand() - 1) * sx, y = cy + (rand() + rand() - 1) * sy;
      if (y < 268 || blocked(x, y)) continue;
      trees.push({ x, y, s: (0.42 + 0.95 * ((y - 255) / 560)) * (0.8 + rand() * 0.5) });
    }
  }
  trees.sort((a, b) => a.y - b.y);
  const treeNodes = trees.map((t) => h('use', { href: '#conifer', transform: `translate(${r1(t.x)},${r1(t.y)}) scale(${r1(t.s)})` }));

  // --- Shade that spreads over shared places during the acceleration ---
  const shade = h('g', { id: 'shade', opacity: 0 },
    h('ellipse', { cx: L1.x, cy: L1.y - 4, rx: 96, ry: 44, fill: 'url(#gShade)' }),
    h('ellipse', { cx: L2.x, cy: L2.y, rx: 96, ry: 42, fill: 'url(#gShade)' }),
    ...[10, 30, 50].map((i) => h('ellipse', { cx: r1(trail[i].x), cy: r1(trail[i].y), rx: 110, ry: 46, fill: 'url(#gShade)' })),
  );

  // --- Village growth: gardens, groves, porous perimeters, small hosts ---
  const villages: SvgNode[] = [];
  VILLAGES.forEach((v, g) => {
    const c = vc[g];
    const beds: SvgNode[] = [];
    const bedSites: [number, number, number, number, number][] = [[-30, 20, 19, 6.5, -8], [24, 22, 21, 7, 6], [0, 36, 15, 5, 0]];
    bedSites.forEach(([dx, dy, rx, ry, rot], b) => {
      const d = `M${-rx},0 Q${-rx},${-ry} 0,${-ry} Q${rx},${-ry} ${rx},0 Q${rx},${ry} 0,${ry} Q${-rx},${ry} ${-rx},0Z`;
      beds.push(h('g', { transform: `translate(${r1(c.x + dx)},${r1(c.y + dy)}) rotate(${rot})` },
        h('path', { class: 'bedFill', d, fill: b % 2 ? '#C9B26B' : '#8FB56A' }),
        h('path', { class: 'bedRow', d: `M${-rx * 0.7},${-ry * 0.36} h${rx * 1.4} v1.2 h${-rx * 1.4}Z M${-rx * 0.8},${ry * 0.2} h${rx * 1.6} v1.2 h${-rx * 1.6}Z`, fill: '#3F6B45' }),
        h('path', { class: 'bedLine', d, fill: 'none', stroke: '#F1EBDD', 'stroke-width': 1.3, pathLength: 1, 'stroke-dasharray': '1 1' })));
    });
    villages.push(h('g', { id: `gard${g}`, class: 'garden' }, ...beds));
    villages.push(h('g', { id: `grove${g}` }, ...GROVE.filter((t) => t.g === g).map((t) =>
      h('use', { id: t.id, href: t.blossom ? '#blossomTree' : '#roundTree', transform: `translate(${t.x},${t.y}) scale(0)` }))));
  });

  // Irregular, porous perimeter loops (drawn around the final ring positions).
  const rings: SvgNode[] = VILLAGES.map((v, g) => {
    const c = vc[g];
    const P: Pt[] = [];
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const wob = 1 + 0.07 * Math.sin(k * 2.3 + g * 1.7) + 0.04 * Math.cos(k * 3.1 + g);
      P.push({ x: c.x + Math.cos(a) * 860 * 0.108 * wob, y: c.y + Math.sin(a) * 560 * 0.125 * wob });
    }
    const loop = catmull([P[11], ...P, P[0], P[1]], 6).slice(6, -6);
    return h('path', { id: `ring${g}`, d: `M${pts(loop)}Z`, fill: 'none', stroke: '#A9D3B1', 'stroke-width': 1.2, 'stroke-dasharray': '3 5', 'vector-effect': 'non-scaling-stroke', opacity: 0, 'data-v': v.id });
  });

  // --- Towers: foundation, cast shade, eight persistent segments, channel, reservoir ---
  const towers: SvgNode[] = [];
  const order = [2, 3, 4, 5, 6, 7, 0, 1]; // stack from the base up, then the two buttresses in front
  TOWERS.forEach((t, ti) => {
    const b = towerBase(ti);
    towers.push(h('g', { id: t.id, class: 'tower', 'data-u': t.u, 'data-v': t.v },
      h('ellipse', { id: `${t.id}cast`, cx: b.x, cy: b.y, rx: 10, ry: 4, fill: 'url(#gShade)', opacity: 0 }),
      h('ellipse', { id: `${t.id}base`, cx: b.x, cy: b.y + 3, rx: t.wLow * 0.62, ry: t.wLow * 0.17, fill: 'url(#gStone)', opacity: 0 }),
      h('g', { id: `${t.id}yard`, opacity: 0 },
        h('ellipse', { cx: b.x, cy: b.y + 3, rx: t.wLow * 0.44, ry: t.wLow * 0.115, fill: '#8FB56A' }),
        h('ellipse', { cx: b.x, cy: b.y + 3, rx: t.wLow * 0.2, ry: t.wLow * 0.05, fill: '#B6D4CF' }),
        h('use', { href: '#roundTree', transform: `translate(${r1(b.x - t.wLow * 0.3)},${r1(b.y + 2)}) scale(1.3)` }),
        h('use', { href: '#roundTree', transform: `translate(${r1(b.x + t.wLow * 0.32)},${r1(b.y + 6)}) scale(1.45)` })),
      ...order.map((s) => segment(`${t.id}-${String(s + 1).padStart(2, '0')}`, SEG_DEST[ti][s].form === 'pavilion' && s % 3 === 0)),
      h('rect', { id: `${t.id}ch`, x: b.x - 3, y: b.y, width: 6, height: 0, rx: 3, fill: 'url(#gChannel)', opacity: 0 }),
      h('g', { id: `${t.id}res`, opacity: 0 },
        h('rect', { id: `${t.id}resGlow`, fill: 'url(#gAmberGlow)', rx: 8 }),
        h('rect', { id: `${t.id}resBg`, fill: '#071418', stroke: '#E9BC67', 'stroke-opacity': 0.55, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke', rx: 5 }),
        h('rect', { id: `${t.id}resFill`, fill: 'url(#gAmber)', rx: 3 })),
    ));
  });

  // --- AI feedback ribbon: back halves sit behind the towers, front halves in front ---
  const ribbonHalf = (id: string) => h('path', { id, fill: 'none', stroke: '#B7A9DC', 'stroke-width': 2.2, 'vector-effect': 'non-scaling-stroke', 'stroke-linecap': 'round', opacity: 0 });
  const ribbonBack = h('g', { id: 'ribbonBack' }, ribbonHalf('rbA-b'), ribbonHalf('rbB-b'), ribbonHalf('rbC-b'));
  const ribbonFront = h('g', { id: 'ribbonFront' },
    ...['A', 'B', 'C'].flatMap((k) => [
      h('path', { id: `rb${k}-g`, fill: 'none', stroke: '#B7A9DC', 'stroke-width': 9, 'stroke-opacity': 0.2, 'vector-effect': 'non-scaling-stroke', opacity: 0 }),
      ribbonHalf(`rb${k}-f`),
      h('path', { id: `rb${k}-t`, fill: 'none', stroke: '#EDE6FF', 'stroke-width': 2.2, 'vector-effect': 'non-scaling-stroke', 'stroke-dasharray': '2 22', 'stroke-linecap': 'round', opacity: 0 }),
    ]));

  // --- Relationships: a daylight casing and the visible line for each of the 36 ---
  const routes = h('g', { id: 'routes', fill: 'none', 'stroke-linecap': 'round' },
    ...EDGES.map((e) => h('path', { id: `c${e.id}`, stroke: '#0B2529', 'vector-effect': 'non-scaling-stroke', opacity: 0 })),
    ...EDGES.map((e) => h('path', { id: e.id, class: 'rel', stroke: '#A9D3B1', 'vector-effect': 'non-scaling-stroke' })),
    h('path', { id: 'e01-04', class: 'rel temp', stroke: '#F1EBDD', 'vector-effect': 'non-scaling-stroke', opacity: 0, pathLength: 1 }),
    h('path', { id: 'cta', stroke: '#F1EBDD', 'stroke-width': 2, 'stroke-dasharray': '5 5', 'vector-effect': 'non-scaling-stroke', opacity: 0 }),
    ...[0, 1, 2, 3, 4, 5].map((i) => h('path', { id: `hl${i}`, stroke: '#F1EBDD', 'stroke-width': 2.2, 'vector-effect': 'non-scaling-stroke', pathLength: 1, opacity: 0 })),
  );

  // --- Recapture tendencies (scene 11): three small local platforms ---
  const risks = RISK_SITES.map((_, i) =>
    h('g', { id: `risk${i}`, opacity: 0 },
      h('ellipse', { cx: 0, cy: 0.5, rx: 1.9, ry: 0.6, fill: 'url(#gAmberGlow)' }),
      h('path', { d: 'M-1.2,0.4 L-1.2,-0.5 Q-1.2,-1.1 -0.6,-1.1 L0.6,-1.1 Q1.2,-1.1 1.2,-0.5 L1.2,0.4Z', fill: '#213F3F', stroke: '#E9BC67', 'stroke-width': 1.2, 'vector-effect': 'non-scaling-stroke' }),
      h('rect', { x: -0.3, y: -0.75, width: 0.6, height: 0.5, fill: '#E9BC67' })));

  const hosts = VILLAGES.map((_, g) => homeGlyph(`host${g}`));
  const homes = HOMES.map((_, i) => homeGlyph(`home${i}`));
  const fns = [0, 1, 2, 3].map((k) => functionGlyph(`fn${k}`, k));
  const lenses = [0, 1, 2].map((k) => functionGlyph(`lens${k}`, 2 + (k % 2)));

  const people = h('g', { id: 'people' }, ...NODES.map((_, i) => bead(i)));

  // --- Moving marks: bounded pools, created once ---
  const marks = h('g', { id: 'marks' },
    ...[0, 1, 2, 3, 4, 5].map((i) => h('rect', { id: `xb${i}`, class: 'xb', x: -0.42, y: -1, width: 0.84, height: 2, rx: 0.42, fill: '#F3CF85', stroke: '#8A5A1E', 'stroke-width': 0.8, 'vector-effect': 'non-scaling-stroke', opacity: 0 })),
    ...[0, 1, 2].map((i) => h('circle', { id: `rb${i}`, class: 'rb', r: 1, fill: '#F1EBDD', stroke: '#0B2529', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke', opacity: 0 })),
    h('circle', { id: 'copyM', r: 1, fill: '#0B2529', stroke: '#F1EBDD', 'stroke-width': 1.6, 'stroke-dasharray': '2 2', 'vector-effect': 'non-scaling-stroke', opacity: 0 }),
    h('circle', { id: 'gift', r: 1, fill: '#F1EBDD', stroke: '#0B2529', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke', opacity: 0 }),
    h('circle', { id: 'gift2', r: 1, fill: '#F1EBDD', stroke: '#0B2529', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke', opacity: 0 }),
    h('path', { id: 'diamond', d: 'M0,-1.3 L1.3,0 L0,1.3 L-1.3,0Z', fill: '#0B2529', 'fill-opacity': 0.7, stroke: '#E9BC67', 'stroke-width': 1.8, 'vector-effect': 'non-scaling-stroke', opacity: 0 }),
    h('rect', { id: 'square', x: -1, y: -1, width: 2, height: 2, fill: 'none', stroke: '#F1EBDD', 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke', opacity: 0 }),
    h('g', { id: 'record', opacity: 0 },
      h('rect', { x: -1, y: -1.2, width: 2, height: 2.4, rx: 0.3, ...glyphStroke }),
      h('path', { d: 'M-0.5,-0.5 L0.5,-0.5 M-0.5,0 L0.5,0 M-0.5,0.5 L0.1,0.5', ...glyphLine })),
    h('circle', { id: 'ctaRing', r: 1, fill: 'none', stroke: '#F1EBDD', 'stroke-width': 1.6, 'stroke-dasharray': '3 3', 'vector-effect': 'non-scaling-stroke', opacity: 0 }),
  );

  const labels = h('g', { id: 'labels' },
    label('lblYou', 'you'), label('lblFriend', 'your friend'),
    label('lblHome0', 'Home A'), label('lblHome1', 'Home B'), label('lblHome2', 'Home C'),
    label('lblFn0', 'Your name'), label('lblFn1', 'What you have made'), label('lblFn2', 'Finding people'), label('lblFn3', 'Viewing things'),
    label('lblRecord', 'Your chosen home'),
  );

  // --- Foreground plane: large quiet silhouettes that frame the valley ---
  const fg: SvgNode[] = [];
  const fgSites: [number, number, number][] = [
    [-640, 1010, 9], [-520, 960, 7], [-400, 1040, 10], [-290, 950, 6.5], [-180, 1030, 9], [-70, 990, 7.5],
    [30, 1050, 8], [130, 1000, 5.5], [250, 1060, 7], [380, 1040, 6], [520, 1070, 6.5], [650, 1045, 6],
    [790, 1060, 7], [900, 1010, 6], [1000, 1050, 9], [1100, 980, 8], [1210, 1040, 10], [1330, 960, 8], [1460, 1030, 10],
  ];
  for (const [x, y, s] of fgSites) fg.push(h('use', { href: '#coniferFg', transform: `translate(${x},${y}) scale(${s})` }));
  fg.push(h('rect', { x: -4000, y: 1040, width: 9000, height: 5000, fill: 'url(#gFg)' }));

  return h('g', { id: 'world' },
    defs(),
    h('g', { id: 'cam' },
      far,
      h('g', { id: 'pMid' },
        h('rect', { x: -4000, y: -6000, width: 9000, height: 12000, fill: '#10272D' }),
        // Registered painted geography; no people, routes or architecture are baked in.
        // Only the lighting layers blend. The live graph and all tower pieces persist.
        h('g', { id: 'paintedTerrain', mask: 'url(#plateFadeX)' }, h('g', { mask: 'url(#plateFadeY)' },
          h('image', { id: 'terrainNight', href: plates.night, x: -70, y: -24, width: 1110, height: 900, preserveAspectRatio: 'none' }),
          ...(plates.day ? [h('image', { id: 'terrainDay', href: plates.day, x: -70, y: -24, width: 1110, height: 900, preserveAspectRatio: 'none', opacity: 0 })] : []),
          h('rect', { id: 'terrainGloom', x: -70, y: -24, width: 1110, height: 900, fill: '#081C25', opacity: 0 }),
        )),
        // Keep the registered river landmark for geometry and identity checks.
        h('g', { opacity: 0 }, river),
        ...civic,
        h('g', { id: 'huts', opacity: 0 }, ...huts),
        h('g', { id: 'treesBack', opacity: 0 }, ...treeNodes),
        lamps,
        ...villages,
        shade,
        h('g', { id: 'rings' }, ...rings),
        ribbonBack,
        h('g', { id: 'towers' }, ...towers),
        ribbonFront,
        routes,
        h('g', { id: 'glyphs' }, ...risks, ...hosts, ...homes, ...lenses, ...fns),
        people,
        marks,
      ),
      // Painted groves supply the foreground; retain the plane's identity/parallax.
      h('g', { id: 'pFg' }),
      labels,
    ),
  );
};
