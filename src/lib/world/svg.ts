// Minimal SVG node tree. The static world is built once as a tree; a frame is
// a flat map of element id to attributes. The build serializes tree + frame
// to a string; the browser applies the same frame to persistent DOM nodes.

export type Attrs = Record<string, string | number>;
export interface SvgNode {
  tag: string;
  a: Attrs;
  c: (SvgNode | string)[];
}
export type Frame = Record<string, Attrs>;

export const h = (tag: string, a: Attrs = {}, ...c: (SvgNode | string)[]): SvgNode => ({ tag, a, c });

export const r1 = (n: number) => Math.round(n * 10) / 10;
export const r2 = (n: number) => Math.round(n * 100) / 100;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export const serialize = (node: SvgNode | string, frame: Frame = {}): string => {
  if (typeof node === 'string') return esc(node);
  const dyn = node.a.id !== undefined ? frame[String(node.a.id)] : undefined;
  const attrs = dyn ? { ...node.a, ...dyn } : node.a;
  let out = `<${node.tag}`;
  for (const k in attrs) out += ` ${k}="${esc(String(attrs[k]))}"`;
  if (!node.c.length) return out + '/>';
  out += '>';
  for (const child of node.c) out += serialize(child, frame);
  return out + `</${node.tag}>`;
};

// --- Colour ------------------------------------------------------------------

const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const cache = new Map<string, number[]>();
const rgb = (hex: string) => {
  let v = cache.get(hex);
  if (!v) cache.set(hex, (v = parse(hex)));
  return v;
};
export const mix = (a: string, b: string, t: number) => {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const p = rgb(a);
  const q = rgb(b);
  const c = (i: number) => Math.round(p[i] + (q[i] - p[i]) * t).toString(16).padStart(2, '0');
  return `#${c(0)}${c(1)}${c(2)}`;
};

/** Deterministic PRNG for scenery placement (never used for people or routes). */
export const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
