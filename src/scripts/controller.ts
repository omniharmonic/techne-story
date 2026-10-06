// Timeline controller. Scroll position is the film's time axis: every frame is
// derived from where the reader is, never accumulated. Reader actions (send,
// leave, choose a home) are separate, local state that scrolling cancels.

import { E, HOMES, NODES, SCENES } from '../lib/world/data.ts';
import {
  DEMO_MS, ambientFrame, computeFrame, scopeMs,
  type AmbientPhase, type DemoState, type FrameContext, type FrameInput,
} from '../lib/world/frame.ts';
import { clamp, ease, seg } from '../lib/world/timeline.ts';
import type { Frame } from '../lib/world/svg.ts';
import { CAPTIONS } from '../lib/sceneMeta.ts';

const root = document.documentElement;
const $ = <T extends Element>(sel: string, from: ParentNode = document) => from.querySelector<T>(sel)!;
const $$ = <T extends Element>(sel: string, from: ParentNode = document) => Array.from(from.querySelectorAll<T>(sel));

const svg = $<SVGSVGElement>('#worldSvg');
const stage = $<HTMLElement>('#stage');
const header = $<HTMLElement>('.site-header');
const narrative = $<HTMLElement>('.narrative');
const sections = $$<HTMLElement>('.scene');
const announcer = $<HTMLElement>('#announcer');
const worldDesc = $('#worldDesc');
const stageCaption = $<HTMLElement>('#stageCaption');
const expandBtn = $<HTMLButtonElement>('#expandBtn');
const overlayQuery = window.matchMedia('(min-width: 1100px) and (min-height: 600px)');
const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const READER_HOME = { gx: NODES[0].gx, gy: NODES[0].gy };

const flags = { story: false, paused: false, reduce: reduceQuery.matches, unpinned: false, expanded: false };
const motionOff = () => flags.paused || flags.reduce;
const live = () => !flags.story && !flags.unpinned;
const staticOutcome = () => motionOff() || !live();

const ui = {
  reader: null as { gx: number; gy: number } | null,
  cut: 0,
  risks: [0, 0, 0],
  community: -1,
  group: 0,
};

let view = { upp: 1.12, mobile: false, bounds: { x0: 0, y0: 0, x1: E.w, y1: E.h } };
let tops: number[] = [];
let T = 0;
let scene = 0;
let intro = 1;
let introStart = 0;
let ctx: FrameContext | null = null;
let dirty = true;
let rafId = 0;
let last = 0;
let stageVisible = true;
let frozen = false; // QA only: hold ambient beads still for deterministic captures
const phase: AmbientPhase = { ext: 0, rec: 0, rib: 0 };

// --- Applying frames: only attributes that changed touch the DOM ---------------

const els = new Map<string, Element | null>();
const prev = new Map<string, Record<string, string>>();
const apply = (frame: Frame) => {
  for (const id in frame) {
    let el = els.get(id);
    if (el === undefined) els.set(id, (el = document.getElementById(id)));
    if (!el) continue;
    let p = prev.get(id);
    if (!p) prev.set(id, (p = {}));
    const attrs = frame[id];
    for (const a in attrs) {
      const v = String(attrs[a]);
      if (p[a] !== v) { el.setAttribute(a, v); p[a] = v; }
    }
  }
};

// --- Demonstrations --------------------------------------------------------------

interface Running {
  state: DemoState;
  total: number;
  start: number;
  running: boolean;
  phases: [number, string][];
  final: string;
  status: HTMLElement | null;
  block: HTMLElement | null;
  keep: boolean;
  said: number;
}
let demo: Running | null = null;

interface Tween { ms: number; start: number; step: (t: number) => void; done?: () => void }
let tweens: Tween[] = [];
const tween = (ms: number, step: (t: number) => void, done?: () => void) => {
  if (staticOutcome()) { step(1); done?.(); dirty = true; request(); return; }
  tweens.push({ ms, start: performance.now(), step, done });
  request();
};

const announce = (text: string) => { announcer.textContent = ''; announcer.textContent = text; };
const setStatus = (el: HTMLElement | null, text: string) => { if (el && el.textContent !== text) el.textContent = text; };
const showPair = (name: string, on = true) => $$<HTMLElement>(`.pair[data-pair="${name}"]`).forEach((p) => p.classList.toggle('show', on));

const SEND: Record<string, { phases: [number, string][]; final: string; pair: string }> = {
  'send-open': { phases: [[0, 'Sending…'], [900, 'Your friend received it.']], final: 'Your friend received it. Something came back directly.', pair: 'open' },
  'send-captured': {
    phases: [[0, 'Sending…'], [900, 'The platform kept a copy and decided what to pass on.']],
    final: 'Your friend received it with something else. Nothing came back directly.', pair: 'captured',
  },
  'send-freed': { phases: [[0, 'Sending…'], [900, 'It went directly.']], final: 'It went directly. Your copy rests in the home you chose.', pair: 'freed' },
  'send-alive': {
    phases: [[0, 'Sending…'], [900, 'Your friend received it.'], [1200, 'Your friend is passing something on.'], [3900, 'It is still traveling.']],
    final: 'Your gift traveled on. Something returned from someone you had not met.', pair: 'alive',
  },
};

const finishDemo = () => {
  if (!demo) return;
  demo.state.ms = demo.total;
  demo.running = false;
  setStatus(demo.status, demo.final);
  const block = demo.block;
  if (block) {
    $$<HTMLButtonElement>('[aria-disabled]', block).forEach((b) => b.removeAttribute('aria-disabled'));
    const replay = block.querySelector<HTMLButtonElement>('[data-action="replay"]');
    if (replay) { replay.hidden = false; replay.textContent = staticOutcome() ? 'Show outcome' : 'Replay'; }
  }
  if (!demo.keep) demo = null;
  dirty = true;
};

const startDemo = (state: DemoState, total: number, opts: { phases?: [number, string][]; final: string; block: HTMLElement; keep?: boolean; pair?: string }) => {
  if (demo?.running) return; // never queue a second demonstration
  const status = opts.block.querySelector<HTMLElement>('.status');
  demo = { state, total, start: performance.now(), running: true, phases: opts.phases ?? [], final: opts.final, status, block: opts.block, keep: opts.keep ?? true, said: -1 };
  if (staticOutcome()) {
    if (opts.pair) showPair(opts.pair);
    finishDemo();
  } else {
    if (opts.pair) showPair(opts.pair, false);
    $$<HTMLButtonElement>('[data-action="send"], [data-action="ripple"]', opts.block).forEach((b) => b.setAttribute('aria-disabled', 'true'));
  }
  dirty = true;
  request();
};

const resetScene = (index: number) => {
  const sec = sections[index];
  if (!sec) return;
  demo = null;
  tweens = [];
  ui.reader = null; ui.cut = 0; ui.risks = [0, 0, 0]; ui.community = -1; ui.group = 0;
  $$<HTMLElement>('.status', sec).forEach((s) => (s.textContent = ''));
  $$<HTMLButtonElement>('[data-action="replay"], [data-action="back"], [data-action="reset"]', sec).forEach((b) => (b.hidden = true));
  $$<HTMLButtonElement>('[aria-disabled]', sec).forEach((b) => b.removeAttribute('aria-disabled'));
  $$<HTMLButtonElement>('[data-home], [data-community]', sec).forEach((b) => b.setAttribute('aria-pressed', 'false'));
  $$<HTMLButtonElement>('[data-group]', sec).forEach((b, i) => b.setAttribute('aria-pressed', String(i === 0)));
  $$<HTMLButtonElement>('[data-risk]', sec).forEach((b) => b.setAttribute('aria-expanded', 'false'));
  $$<HTMLElement>('.risk-text', sec).forEach((p) => (p.hidden = true));
  $$<HTMLElement>('.pair.show', sec).forEach((p) => p.classList.remove('show'));
  dirty = true;
};

// --- Layout: fit the essential rectangle of the world into the art window -------

const measure = () => {
  const y = window.scrollY;
  tops = sections.map((s) => s.getBoundingClientRect().top + y);
};

const layout = () => {
  const overlay = overlayQuery.matches;
  const ih = window.innerHeight;
  if (!overlay) {
    const headerH = header.offsetHeight;
    root.style.setProperty('--header-h', `${headerH}px`);
    const base = clamp(0.42 * ih, 240, 360);
    if (flags.expanded && ih - headerH - Math.min(0.72 * ih, 620) < 120) flags.expanded = false;
    // Release the sticky world when it would leave too little room to read.
    flags.unpinned = ih - headerH - base < 240;
  } else {
    root.style.removeProperty('--header-h');
    flags.unpinned = false;
    flags.expanded = false;
  }
  root.classList.toggle('unpinned', flags.unpinned);
  root.classList.toggle('expanded', flags.expanded);
  root.classList.toggle('film-live', live());
  expandBtn.textContent = flags.expanded ? 'Collapse illustration' : 'Expand illustration';
  expandBtn.setAttribute('aria-pressed', String(flags.expanded));

  if (live()) {
    const r = stage.getBoundingClientRect();
    const w = r.width, h = r.height;
    let ax = 6, ay = 4, aw = w - 12, ah = h - 8;
    if (overlay) {
      ax = narrative.getBoundingClientRect().right + 64;
      ay = 72;
      aw = w - ax - 16;
      ah = h - ay - 16;
    }
    const s = Math.max(0.05, Math.min(aw / E.w, ah / E.h));
    const vbW = w / s, vbH = h / s;
    const vbX = E.x - (ax + (aw - E.w * s) / 2) / s;
    const vbY = E.y - (ay + (ah - E.h * s) / 2) / s;
    svg.setAttribute('viewBox', `${vbX.toFixed(1)} ${vbY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}`);
    view = { upp: 1 / s, mobile: !overlay, bounds: { x0: vbX, y0: vbY, x1: vbX + vbW, y1: vbY + vbH } };
  }
  measure();
  dirty = true;
  request();
};

// Give the world a whole viewport of travel. A gentle linear clock avoids
// stacking cubic scroll easing on top of the per-track easing in the model.
const WINDOW = { from: 0.95, to: 0.15 };
const computeT = () => {
  const vh = window.innerHeight, y = window.scrollY;
  // On stacked screens the illustration occupies the upper reading viewport.
  // Settle each world when its heading reaches the usable prose window.
  const end = live() && !overlayQuery.matches
    ? Math.min(0.8, (header.offsetHeight + stage.offsetHeight + 16) / vh)
    : WINDOW.to;
  const active = overlayQuery.matches ? 0.5 : (WINDOW.from + end) / 2;
  let t = 0, current = 0;
  for (let k = 1; k < sections.length; k++) {
    const top = tops[k] - y;
    const p = clamp((WINDOW.from * vh - top) / ((WINDOW.from - end) * vh));
    t += motionOff() ? (p >= 0.5 ? 1 : 0) : p;
    if (top <= active * vh) current = k;
  }
  return { t, current };
};

const input = (): FrameInput => ({
  T,
  upp: view.upp,
  beadPx: view.mobile ? 4 : 6,
  specialPx: view.mobile ? 6 : 8,
  labelPx: 16,
  bounds: view.bounds,
  intro,
  demo: demo ? demo.state : null,
  reader: ui.reader,
  cut: ui.cut,
  risks: ui.risks,
  community: ui.community,
  labels: !view.mobile,
});

const acts = $$<HTMLAnchorElement>('.acts a');
const ACT_OF = [0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3];
const reader = () => document.getElementById('n01');

const enterScene = (next: number) => {
  if (next === scene) return;
  const busy = !!demo?.running || tweens.length > 0;
  resetScene(scene);
  scene = next;
  if (busy) announce('Demo reset for the next scene.');
  acts.forEach((a, i) => (ACT_OF[scene] === i ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  worldDesc.textContent = CAPTIONS[SCENES[scene]];
  stageCaption.hidden = scene < 10;
  stage.dataset.scene = SCENES[scene];
  reader()?.classList.toggle('draggable', scene === 7);
};

// --- The loop: runs only while something is changing ----------------------------

const ambientOn = () => live() && !motionOff() && !document.hidden && stageVisible && !frozen;

const tick = (now: number) => {
  rafId = 0;
  const dt = Math.min(100, now - (last || now));
  last = now;
  let full = dirty;
  dirty = false;

  if (introStart) {
    intro = clamp((now - introStart) / 1200);
    if (intro >= 1) introStart = 0;
    full = true;
  }
  if (tweens.length) {
    tweens = tweens.filter((tw) => {
      const t = clamp((now - tw.start) / tw.ms);
      tw.step(ease(t));
      if (t >= 1) tw.done?.();
      return t < 1;
    });
    full = true;
  }
  if (demo?.running) {
    demo.state.ms = Math.min(demo.total, now - demo.start);
    for (let i = demo.phases.length - 1; i > demo.said; i--) {
      if (demo.state.ms >= demo.phases[i][0]) { demo.said = i; setStatus(demo.status, demo.phases[i][1]); break; }
    }
    if (demo.state.ms >= demo.total) finishDemo();
    full = true;
  }

  if (full) {
    const { t, current } = computeT();
    T = t;
    enterScene(current);
    if (live()) {
      const out = computeFrame(input());
      ctx = out.ctx;
      apply(out.frame);
    }
  }

  const amb = ambientOn();
  if (ctx && live()) {
    if (amb) {
      const accel = seg(T, 3, 3.75);
      phase.ext = (phase.ext + dt / 1000 / (2.5 - 1.25 * accel)) % 6000;
      phase.rec = (phase.rec + dt / 1000 / 2.5) % 3000;
      phase.rib = (phase.rib + (dt / 1000) * (0.5 + 0.9 * accel)) % 1000;
      apply(ambientFrame(ctx, phase));
    } else if (full) {
      apply(ambientFrame(ctx, null));
    }
  }
  if (amb || introStart || tweens.length || demo?.running || dirty) request();
  else last = 0;
};

function request() {
  if (!rafId) rafId = requestAnimationFrame(tick);
}

// --- Reader actions ----------------------------------------------------------------

const moveReader = (to: { gx: number; gy: number } | null, ms: number, done?: () => void) => {
  const from = ui.reader ?? READER_HOME;
  const target = to ?? READER_HOME;
  tween(ms, (t) => {
    ui.reader = { gx: from.gx + (target.gx - from.gx) * t, gy: from.gy + (target.gy - from.gy) * t };
  }, () => { if (!to) ui.reader = null; done?.(); });
};

const homeTarget = (i: number) => {
  const lift = (24 * view.upp) / (560 * 0.86);
  return { gx: HOMES[i][0], gy: HOMES[i][1] - lift };
};

const chooseHome = (i: number, block: HTMLElement, instant = false) => {
  const done = () => {
    setStatus(block.querySelector('.status'), `You moved to Home ${'ABC'[i]}. Every relationship came with you.`);
    $$<HTMLButtonElement>('[data-home]', block).forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
  };
  if (instant) { ui.reader = homeTarget(i); done(); dirty = true; request(); } else moveReader(homeTarget(i), 600, done);
};

document.addEventListener('click', (ev) => {
  const btn = (ev.target as Element).closest<HTMLButtonElement>('button');
  if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
  const block = btn.closest<HTMLElement>('.demo');
  if (!block) return;
  const status = block.querySelector<HTMLElement>('.status');
  const kind = block.dataset.kind as DemoState['kind'] | undefined;
  const action = btn.dataset.action;

  if (block.dataset.demo === 'send' && (action === 'send' || action === 'replay') && kind) {
    if (demo?.running) return;
    demo = null;
    startDemo({ kind, ms: 0 }, DEMO_MS[kind], { ...SEND[kind], block });
  } else if (action === 'ripple' && kind) {
    const node = Number(block.querySelector<HTMLSelectElement>('select')!.value);
    if (demo?.running) return;
    demo = null;
    const captured = kind === 'ripple-captured';
    startDemo({ kind, ms: 0, node }, DEMO_MS[kind], {
      phases: [[0, 'The ripple is traveling…']],
      final: captured
        ? 'The ripple reached the middle and stopped. It did not spread to anyone.'
        : 'The ripple spread from person to person and came back. Where paths crossed, a pattern formed that no one drew.',
      block, keep: captured,
    });
  } else if (block.dataset.demo === 'leave') {
    const leave = block.querySelector<HTMLButtonElement>('[data-action="leave"]')!;
    const back = block.querySelector<HTMLButtonElement>('[data-action="back"]')!;
    const resetBtn = block.querySelector<HTMLButtonElement>('[data-action="reset"]')!;
    if (action === 'leave') {
      leave.setAttribute('aria-disabled', 'true');
      if (staticOutcome()) showPair('leave-captured');
      tween(800, (t) => { ui.cut = t; ui.reader = { gx: READER_HOME.gx + (0.04 - READER_HOME.gx) * t, gy: READER_HOME.gy + (0.94 - READER_HOME.gy) * t }; }, () => {
        setStatus(status, 'You left. Your connections here were cut.');
        back.hidden = false; resetBtn.hidden = false;
      });
    } else if (action === 'back') {
      tween(800, (t) => { ui.cut = 1 - t; ui.reader = { gx: 0.04 + (READER_HOME.gx - 0.04) * t, gy: 0.94 + (READER_HOME.gy - 0.94) * t }; }, () => {
        ui.reader = null; ui.cut = 0;
        setStatus(status, 'You went back. Your connections were restored.');
        back.hidden = true; resetBtn.hidden = true; leave.removeAttribute('aria-disabled'); leave.focus();
      });
    } else if (action === 'reset') {
      resetScene(scene); leave.focus(); request();
    }
  } else if (block.dataset.demo === 'migrate') {
    const leave = block.querySelector<HTMLButtonElement>('[data-action="leave"]')!;
    const resetBtn = block.querySelector<HTMLButtonElement>('[data-action="reset"]')!;
    if (action === 'leave') {
      leave.setAttribute('aria-disabled', 'true');
      if (staticOutcome()) showPair('freed-move');
      moveReader({ gx: READER_HOME.gx + 0.1, gy: READER_HOME.gy }, 800, () => {
        setStatus(status, 'You moved homes. Your relationships stayed connected.');
        resetBtn.hidden = false;
      });
    } else if (action === 'reset') {
      resetScene(scene); leave.focus(); request();
    }
  } else if (btn.dataset.home !== undefined) {
    chooseHome(Number(btn.dataset.home), block);
  } else if (btn.dataset.group !== undefined) {
    ui.group = Number(btn.dataset.group);
    ui.community = ui.group;
    $$<HTMLButtonElement>('[data-group]', block).forEach((b, k) => b.setAttribute('aria-pressed', String(k === ui.group)));
    if (!demo?.running) demo = null;
    dirty = true; request();
  } else if (btn.dataset.scope !== undefined) {
    const scope = Number(btn.dataset.scope);
    if (demo?.running) return;
    demo = null;
    startDemo({ kind: 'scope', ms: 0, group: ui.group, scope }, scopeMs(scope), {
      final: [
        'Shared with everyone: it crossed the edge of the community and traveled on to another.',
        'Shared with members: it circulated inside the community and did not cross its edge.',
        'Kept: it stays with one person.',
      ][scope],
      block,
    });
  } else if (btn.dataset.community !== undefined) {
    const g = Number(btn.dataset.community);
    ui.community = ui.community === g ? -1 : g;
    $$<HTMLButtonElement>('[data-community]', block).forEach((b, k) => b.setAttribute('aria-pressed', String(k === ui.community)));
    setStatus(status, ui.community < 0 ? '' : ['An imagined garden commons: peers could coordinate planting and share what they learn.', 'An imagined tool library: neighbors could share useful things and care for them together.', 'An imagined shared calendar: gatherings could be found across compatible tools.', 'An imagined watershed network: communities could exchange observations and coordinate care.'][g]);
    dirty = true; request();
  } else if (btn.dataset.risk !== undefined) {
    const i = Number(btn.dataset.risk);
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    document.getElementById(`risk-${i}`)!.hidden = !open;
    const from = ui.risks[i];
    tween(500, (t) => { ui.risks[i] = from + ((open ? 1 : 0) - from) * t; });
    setStatus(status, open ? 'Nearby relationships straightened and reached around it.' : '');
  }
});

// Dragging your bead to a home (scene 7). The three buttons do the same thing.
{
  let drag: { from: { gx: number; gy: number } | null; id: number } | null = null;
  const toGraph = (ev: PointerEvent) => {
    const m = (document.getElementById('pMid') as unknown as SVGGElement).getScreenCTM()!.inverse();
    const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m);
    return { gx: ((p.x - 70) / 860 - 0.04) / 0.92, gy: ((p.y - 255) / 560 - 0.1) / 0.86 };
  };
  const block = () => $<HTMLElement>('.demo[data-demo="homes"]');
  const end = (commit: boolean) => {
    if (!drag) return;
    const at = ui.reader;
    const from = drag.from;
    drag = null;
    reader()?.classList.remove('dragging');
    if (commit && at) {
      const near = HOMES.map(([gx, gy], i) => ({ i, d: Math.hypot((gx - at.gx) * 0.92 * 860, (gy - at.gy) * 0.86 * 560) / view.upp })).sort((a, b) => a.d - b.d)[0];
      if (near.d <= 56) { chooseHome(near.i, block(), true); return; }
    }
    ui.reader = at;
    moveReader(from, 300, () => setStatus(block().querySelector('.status'), 'Not moved. Drop your bead on a home, or use the buttons.'));
  };
  svg.addEventListener('pointerdown', (ev) => {
    const hit = (ev.target as Element).closest('#n01');
    if (!hit || scene !== 7 || staticOutcome()) return;
    drag = { from: ui.reader, id: ev.pointerId };
    hit.setPointerCapture(ev.pointerId);
    tweens = [];
    ev.preventDefault();
  });
  svg.addEventListener('pointermove', (ev) => {
    if (!drag || ev.pointerId !== drag.id) return;
    ui.reader = toGraph(ev);
    dirty = true; request();
  });
  svg.addEventListener('pointerup', (ev) => { if (drag && ev.pointerId === drag.id) end(true); });
  svg.addEventListener('pointercancel', () => end(false));
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && drag) end(false); });
}

// --- Reading options ----------------------------------------------------------------

// The reading anchor is the first piece of story text below the pinned chrome.
const anchors = $$<HTMLElement>('.scene > h2, .scene > .act-label, .prose > *');
const keepAnchor = (change: () => void) => {
  const edge = Math.max(0, header.getBoundingClientRect().bottom) + (live() && !overlayQuery.matches ? stage.offsetHeight : 0) + 4;
  const el = anchors.find((a) => a.getBoundingClientRect().bottom > edge) ?? sections[scene];
  const before = el.getBoundingClientRect().top;
  change();
  layout();
  window.scrollBy(0, el.getBoundingClientRect().top - before);
  measure();
  dirty = true; request();
};

const optionsBtn = $<HTMLButtonElement>('#optionsBtn');
const options = $<HTMLElement>('#options');
const setOptions = (open: boolean) => {
  options.hidden = !open;
  optionsBtn.setAttribute('aria-expanded', String(open));
  layout();
};
optionsBtn.addEventListener('click', () => setOptions(options.hidden));
$('#optClose').addEventListener('click', () => { setOptions(false); optionsBtn.focus(); });

const press = (btn: Element, on: boolean) => btn.setAttribute('aria-pressed', String(on));
$('#optStory').addEventListener('click', (ev) => {
  flags.story = !flags.story;
  press(ev.currentTarget as Element, flags.story);
  keepAnchor(() => { root.classList.toggle('story', flags.story); resetScene(scene); });
});
$('#optHood').addEventListener('click', (ev) => {
  const on = (ev.currentTarget as Element).getAttribute('aria-pressed') !== 'true';
  press(ev.currentTarget as Element, on);
  keepAnchor(() => $$<HTMLDetailsElement>('details.deep').forEach((d) => (d.open = on)));
});
const settleMotion = () => {
  root.classList.toggle('paused', flags.paused);
  root.classList.toggle('reduce', flags.reduce);
  // A demonstration in flight finishes into its static outcome immediately.
  if (motionOff()) {
    intro = 1; introStart = 0;
    if (demo?.running) { const pair = SEND[demo.state.kind]?.pair; if (pair) showPair(pair); finishDemo(); }
    for (const tw of tweens) { tw.step(1); tw.done?.(); }
    tweens = [];
  }
  $$<HTMLButtonElement>('[data-action="replay"]').forEach((b) => (b.textContent = staticOutcome() ? 'Show outcome' : 'Replay'));
  dirty = true; request();
};
$('#optPause').addEventListener('click', (ev) => {
  flags.paused = !flags.paused;
  press(ev.currentTarget as Element, flags.paused);
  settleMotion();
});
reduceQuery.addEventListener('change', () => { flags.reduce = reduceQuery.matches; settleMotion(); });

expandBtn.addEventListener('click', () => { flags.expanded = !flags.expanded; layout(); });

// --- Wiring ---------------------------------------------------------------------------

window.addEventListener('scroll', () => {
  if (introStart) { introStart = 0; intro = 1; }
  dirty = true; request();
}, { passive: true });
window.addEventListener('resize', layout);
overlayQuery.addEventListener('change', layout);
document.addEventListener('visibilitychange', () => { last = 0; request(); });
document.addEventListener('toggle', (ev) => { if ((ev.target as Element).matches?.('details')) { measure(); dirty = true; request(); } }, true);
new ResizeObserver(() => { measure(); dirty = true; request(); }).observe(narrative);
new IntersectionObserver((entries) => { stageVisible = entries[0].isIntersecting; request(); }).observe(stage);
new IntersectionObserver((entries) => root.classList.toggle('nav-released', entries[0].isIntersecting)).observe($('.site-footer'));
document.fonts?.ready.then(layout);
window.addEventListener('beforeprint', () => $$<HTMLDetailsElement>('details').forEach((d) => (d.open = true)));

layout();
if (window.scrollY < 8 && !motionOff() && live()) { intro = 0; introStart = performance.now(); }
request();

// Read-only probe for QA: identity counts and loop state must stay bounded.
(window as any).__techne = {
  freeze: (on: boolean) => { frozen = on; dirty = true; request(); },
  state: () => ({
    T, scene: SCENES[scene], intro, loop: rafId !== 0, ambient: ambientOn(), tweens: tweens.length, demo: demo ? { ...demo.state, running: demo.running } : null,
    people: svg.querySelectorAll('.person').length, relationships: svg.querySelectorAll('.rel:not(.temp)').length,
    segments: svg.querySelectorAll('.seg').length, elements: svg.querySelectorAll('*').length,
    flags: { ...flags }, view,
  }),
};
