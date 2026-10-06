// The film's time axis. T is a single number: integer k is the endpoint of
// scene k (0 = Open 1 ... 12 = Alive 12), and the interval (k-1, k) is the
// transition into scene k. Every quantity below is a pure function of T, so
// backward scroll, deep links and resize derive the same world.

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const smooth = (t: number) => t * t * (3 - 2 * t);
/** 0 before a, 1 after b, smooth in between. */
export const seg = (T: number, a: number, b: number) => smooth(clamp((T - a) / (b - a)));

type Key = [T: number, value: number];
const track = (T: number, keys: Key[]) => {
  if (T <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (T <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      return lerp(v0, v1, smooth((T - t0) / (t1 - t0)));
    }
  }
  return keys[keys.length - 1][1];
};

/** Exact endpoint definitions: the keyframes of every world quantity. */
export const TRACKS: Record<string, Key[]> = {
  // Captured 3: 0-20% platforms rise, 20-75% paths bend, 75-100% extraction starts.
  platform: [[1, 0], [1.2, 1]],
  captureIn: [[1.2, 0], [1.75, 1]],
  // Freed 6: first 25% the reader/friend bypass, next 35% the other bypasses.
  friendBypass: [[5, 0], [5.25, 1]],
  releaseOut: [[5.25, 0], [5.6, 1]],
  functions: [[5.6, 0], [6, 1], [7.2, 1], [7.6, 0]],
  extract: [[1.75, 0], [2, 0.3], [3, 1], [5.25, 1], [6, 0.6], [7, 0.4], [7.3, 0]],
  // Acceleration 4A: 0-25% ribbon, 25-75% vertical scaling, 75-100% shadows.
  ribbon: [[3, 0], [3.25, 1], [6, 1], [7, 0]],
  height: [[3.25, 0], [3.75, 0.92], [5, 1]],
  fill: [[1.75, 0], [2, 0.12], [3, 0.25], [3.25, 0.25], [3.75, 0.85], [7, 0.85], [7.3, 0]],
  shadow: [[3.75, 0], [4, 1], [6, 1], [7.3, 0.5], [8, 0]],
  lampDim: [[2, 0], [3, 0.2], [4, 0.55], [7, 0.55], [8, 0]],
  nodeDim: [[2, 0], [3, 0.3], [5.25, 0.3], [6, 0.1], [7, 0]],
  homes: [[6.1, 0], [6.6, 1], [7.3, 1], [7.7, 0]],
  // Freed 7 to 8: drain 30%, open seams 30%, fan 30%, grow paths 10%.
  seams: [[6.6, 0], [7, 0.25], [7.3, 0.25], [7.6, 1]],
  fan: [[7.6, 0], [7.9, 1]],
  move: [[7.1, 0], [7.9, 1]],
  paths: [[7.9, 0], [8, 1]],
  boundary: [[7.6, 0], [8, 1]],
  // Daylight begins only after direct routes are established.
  day: [[7.6, 0], [8, 0.3], [9, 0.45], [9.65, 0.72], [10, 1]],
  loops: [[8, 0], [9, 1]],
  // Alive 9 to 10: 0-30% garden outlines, 30-65% trees and roofs, 65-100% lights.
  garden: [[9, 0], [9.3, 1]],
  trees: [[9.3, 0], [9.65, 1]],
  lights: [[9.65, 0], [10, 1]],
  recapture: [[10, 0], [11, 1], [12, 0]],
  cta: [[11.4, 0], [12, 1]],
  camera: [[1, 1], [2, 1.08], [3, 1.08], [4, 1.12], [5, 1.12], [6, 1], [9, 1], [10, 0.92]],
  panX: [[1, 0], [4, 10], [6, 0], [10, -8]],
  panY: [[1, 0], [4, -12], [6, 0], [10, 5]],
};

export type Knobs = Record<keyof typeof TRACKS, number>;

export const knobs = (T: number): Knobs => {
  const k: Record<string, number> = {};
  for (const name in TRACKS) k[name] = track(T, TRACKS[name]);
  return k as Knobs;
};

/** Per-item stagger inside a 0..1 interval: items start in order and overlap. */
export const stagger = (p: number, index: number, count: number, dur = 0.3) => {
  const start = (index / Math.max(1, count - 1)) * (1 - dur);
  return smooth(clamp((p - start) / dur));
};

export const SCENE_COUNT = 13;
