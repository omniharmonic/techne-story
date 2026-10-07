/** One reversible clock for the film. All visual states derive from progress. */
import { BEATS, LAST } from './chapters.ts';
export { BEATS, LAST } from './chapters.ts';
export const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, n: number) => { const t = clamp((n - a) / (b - a)); return t * t * (3 - 2 * t); };
export const filmState = (progress: number) => {
  const t = clamp(progress, 0, 7);
  const freedom = smooth(3.7, 5.05, t);
  return {
    t, capture: smooth(.55, 1.65, t) * (1 - freedom),
    rise: smooth(.72, 1.55, t) * (1 - smooth(4.35, 5.4, t)),
    growth: smooth(2.55, 3.35, t),
    eye: smooth(2.75, 3.2, t) * (1 - smooth(3.85, 4.5, t)),
    darkness: smooth(.7, 2.7, t) * (1 - smooth(3.7, 5.3, t)),
    freedom, life: smooth(4.6, 6.3, t),
    network: .7 + .3 * smooth(.15, .8, t),
  };
};
// Stable points; the canvas projects them to the valley in each composition.
export const PEOPLE = Array.from({ length: 27 }, (_, i) => ({
  x: .06 + ((i * 37 + 17) % 101) / 101 * .88,
  y: .13 + ((i * 23 + 11) % 79) / 79 * .76,
  depth: .45 + ((i * 11) % 17) / 34,
}));
export const RELATIONS = PEOPLE.flatMap((_, i) => [
  [i, (i + 4) % PEOPLE.length],
  ...(i % 2 === 0 ? [[i, (i + 9) % PEOPLE.length]] : []),
]);
export type Point = { x: number; y: number };
export function route(a: Point, b: Point, gate: Point, capture: number, u: number): Point {
  const direct = { x: mix(a.x, b.x, u), y: mix(a.y, b.y, u) - Math.sin(u * Math.PI) * Math.abs(a.x - b.x) * .13 };
  const half = u < .5 ? u * 2 : (u - .5) * 2;
  const start = u < .5 ? a : gate, end = u < .5 ? gate : b;
  const via = { x: mix(start.x, end.x, half), y: mix(start.y, end.y, half) - Math.sin(half * Math.PI) * Math.abs(start.x - end.x) * .07 };
  return { x: mix(direct.x, via.x, capture), y: mix(direct.y, via.y, capture) };
}

/** Narrative progress and world progress are separate so chapters can breathe. */
export function sceneAt(progress: number) {
  const p=clamp(progress,0,LAST), i=Math.floor(p);
  return mix(BEATS[i].scene,BEATS[Math.min(LAST,i+1)].scene,p-i);
}
export const chapterIndex = (id:string) => BEATS.findIndex(b=>b.id===id);
