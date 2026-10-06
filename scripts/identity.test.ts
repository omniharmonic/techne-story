// Identity and continuity tests for the world model (QA contract: intermediate
// frames, monotonic growth and release, reversibility, bounded counts).
import test from 'node:test';
import assert from 'node:assert/strict';
import { EDGES, FRIEND_EDGE, NODES, TOWERS } from '../src/lib/world/data.ts';
import { buildWorld } from '../src/lib/world/art.ts';
import { ambientFrame, census, computeFrame } from '../src/lib/world/frame.ts';
import { knobs } from '../src/lib/world/timeline.ts';
import { stillInput } from '../src/lib/world/render.ts';
import { serialize } from '../src/lib/world/svg.ts';

const at = (T: number) => computeFrame(stillInput(T));
const steps = (a: number, b: number, n = 40) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
const markup = serialize(buildWorld());
const count = (re: RegExp) => (markup.match(re) ?? []).length;

test('24 people, 36 relationships, 24 segments, 3 towers exist exactly once', () => {
  assert.deepEqual(census(), { people: 24, relationships: 36, segments: 24, towers: 3 });
  for (const n of NODES) assert.equal(count(new RegExp(`id="${n.id}"`, 'g')), 1, n.id);
  for (const e of EDGES) assert.equal(count(new RegExp(`id="${e.id}"`, 'g')), 1, e.id);
  for (const t of TOWERS) for (let s = 1; s <= 8; s++) assert.equal(count(new RegExp(`id="${t.id}-0${s}"`, 'g')), 1);
  assert.equal(count(/class="person/g), 24);
  assert.equal(count(/class="seg"/g), 24);
  assert.equal(count(/class="xb"/g), 6, 'at most six extraction beads');
  assert.equal(count(/class="rb"/g), 3, 'at most three reciprocal beads');
});

test('every frame addresses the same element ids: nothing is created or dropped', () => {
  const base = Object.keys(at(0).frame).sort();
  for (const T of steps(0, 12, 96)) assert.deepEqual(Object.keys(at(T).frame).sort(), base, `T=${T}`);
});

test('reader and friend keep identity, visibility and marker at every sample', () => {
  for (const T of steps(0, 12, 96)) {
    const { frame } = at(T);
    assert.equal(frame.n01.opacity, 1, `n01 visible at ${T}`);
    assert.equal(frame.n24.opacity, 1, `n24 visible at ${T}`);
    assert.ok(Number(frame.lblYou.opacity) === 1 && Number(frame.lblFriend.opacity) === 1);
  }
});

test('frames are a pure function of T: reversing progress recovers the same world', () => {
  const forward = steps(0, 12, 60).map((T) => JSON.stringify(at(T).frame));
  const backward = steps(0, 12, 60).reverse().map((T) => JSON.stringify(at(T).frame)).reverse();
  assert.deepEqual(forward, backward);
});

test('relationship paths keep one command structure through every morph', () => {
  const shape = (d: string) => d.replace(/-?\d+(\.\d+)?/g, '#');
  for (const e of EDGES) {
    const ref = shape(String(at(0).frame[e.id].d));
    for (const T of steps(0, 12, 48)) assert.equal(shape(String(at(T).frame[e.id].d)), ref, `${e.id} at ${T}`);
  }
});

test('capture: no direct bypass at full capture, none routed after freedom', () => {
  for (const T of [2, 3, 4, 5]) for (const g of at(T).ctx.geom) assert.ok(g.r > 0.999, `fully routed at ${T}`);
  for (const T of [0, 1, 6, 7, 8, 9, 10, 11, 12]) for (const g of at(T).ctx.geom) assert.ok(g.r < 0.001, `direct at ${T}`);
});

test('counter-web: the reader/friend bypass forms before any other, and before towers shrink', () => {
  const g = at(5.25).ctx.geom;
  assert.ok(g[FRIEND_EDGE].r < 0.001, 'friend edge is direct by 25% of the Freed transition');
  assert.ok(g.filter((x, i) => i !== FRIEND_EDGE).every((x) => x.r > 0.999), 'all others still routed');
  for (const T of steps(5, 7.3, 46)) {
    const k = knobs(T);
    assert.ok(k.height >= 0.999 && k.fan === 0, `megaliths stand at full height at ${T}`);
  }
  assert.ok(at(6).ctx.geom.every((x) => x.r < 0.001), 'all bypasses exist while towers still stand');
});

test('acceleration: height, reservoir and shade grow monotonically', () => {
  let prev = knobs(3);
  for (const T of steps(3, 4, 50).slice(1)) {
    const k = knobs(T);
    assert.ok(k.height >= prev.height - 1e-9 && k.fill >= prev.fill - 1e-9 && k.shadow >= prev.shadow - 1e-9 && k.ribbon >= prev.ribbon - 1e-9, `T=${T}`);
    prev = k;
  }
  assert.ok(knobs(4).height > 0.9 && knobs(3).height === 0);
  const h3 = at(3).ctx.towers[0].H, h4 = at(4).ctx.towers[0].H;
  assert.ok(h4 > h3 * 4, 'the main tower visibly changes scale');
});

test('release: extraction falls monotonically and reaches zero before daylight begins', () => {
  let prev = knobs(5.25);
  for (const T of steps(5.25, 8, 110).slice(1)) {
    const k = knobs(T);
    assert.ok(k.extract <= prev.extract + 1e-9, `extract at ${T}`);
    if (k.day > 0) assert.equal(k.extract, 0, `no extraction once day begins (T=${T})`);
    if (k.garden > 0) assert.equal(k.extract, 0);
    prev = k;
  }
});

test('segments move continuously from tower to commons (no swaps or jumps)', () => {
  const pos = (T: number, id: string) => /translate\(([-\d.]+),([-\d.]+)\)/.exec(String(at(T).frame[id].transform))!.slice(1).map(Number);
  for (const t of TOWERS) for (let s = 1; s <= 8; s++) {
    const id = `${t.id}-0${s}`;
    let p = pos(7, id);
    for (const T of steps(7, 8, 4000).slice(1)) { // 1/4000 of a transition per sample
      const q = pos(T, id);
      assert.ok(Math.hypot(q[0] - p[0], q[1] - p[1]) < 3, `${id} jumps at ${T}`);
      p = q;
    }
  }
});

test('final commons are low and no structure dominates', () => {
  const { frame } = at(10);
  for (const t of TOWERS) for (let s = 1; s <= 8; s++) {
    const m = /scale\(([-\d.]+),([-\d.]+)\)/.exec(String(frame[`${t.id}-0${s}`].transform))!;
    assert.ok(Number(m[2]) * 100 <= 0.12 * 930, 'commons height at most .12 of the illustrated viewport');
  }
  assert.equal(Number(frame.T1res.opacity), 0);
});

test('the temporary 37th relationship appears only in the Alive send', () => {
  for (const T of steps(0, 12, 24)) assert.equal(at(T).frame['e01-04'].opacity, 0);
  const done = computeFrame(stillInput(9, { demo: { kind: 'send-alive', ms: 5800 } }));
  assert.ok(Number(done.frame['e01-04'].opacity) > 0);
});

test('existing relationships stay attached to the reader during migration', () => {
  const moved = computeFrame(stillInput(6, { reader: { gx: 0.18, gy: 0.88 } }));
  const p = moved.ctx.pos[0];
  for (const [i, e] of EDGES.entries()) if (e.a === 0) {
    assert.ok(Math.abs(moved.ctx.geom[i].p[0].x - p.x) < 1e-6 && Number(moved.frame[e.id].opacity) > 0.5);
  }
});

test('ambient marks stay bounded for any phase', () => {
  const { ctx } = at(4);
  for (let i = 0; i < 500; i++) {
    const f = ambientFrame(ctx, { ext: i * 0.37, rec: i * 0.29, rib: i });
    const amber = [0, 1, 2, 3, 4, 5].filter((n) => Number(f[`xb${n}`].opacity) > 0).length;
    assert.ok(amber <= 6);
  }
});
