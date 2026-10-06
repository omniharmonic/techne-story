// Build-time rendering: the same tree and frame the live stage uses, serialized.

import { buildWorld, type TerrainPlates } from './art.ts';
import { readFileSync } from 'node:fs';
import { knobs } from './timeline.ts';
import { ambientFrame, computeFrame, type DemoState, type FrameInput } from './frame.ts';
import { serialize, type Frame } from './svg.ts';

export const merge = (...frames: Frame[]): Frame => {
  const out: Frame = {};
  for (const fr of frames) for (const id in fr) out[id] = { ...out[id], ...fr[id] };
  return out;
};

/** Framing used for stills and for the first server-rendered paint of the stage. */
export const STILL_VIEW = { x: -70, y: -24, w: 1110, h: 900 };

export const stillInput = (T: number, extra: Partial<FrameInput> = {}): FrameInput => ({
  T,
  upp: 2,
  beadPx: 4.5,
  specialPx: 6.5,
  labelPx: 17,
  bounds: { x0: STILL_VIEW.x, y0: STILL_VIEW.y, x1: STILL_VIEW.x + STILL_VIEW.w, y1: STILL_VIEW.y + STILL_VIEW.h },
  intro: 1,
  demo: null,
  reader: null,
  cut: 0,
  risks: [0, 0, 0],
  community: -1,
  labels: false,
  ...extra,
});

export const worldMarkup = (input: FrameInput, plates?: TerrainPlates): string => {
  const { frame, ctx } = computeFrame(input);
  return serialize(buildWorld(plates), merge(frame, ambientFrame(ctx, null)));
};

export interface StillSpec {
  T: number;
  demo?: DemoState;
  cut?: number;
  reader?: { gx: number; gy: number };
  title: string;
}

export const renderStill = (spec: StillSpec): string => {
  const v = STILL_VIEW;
  // SVGs used through <img> cannot fetch external images. Embed a compact local
  // plate in the still; the live scene uses the full-resolution cached assets.
  const mode = knobs(spec.T).day >= 0.5 ? 'day' : 'night';
  const night = `data:image/webp;base64,${readFileSync(`public/art/terrain-${mode}-still.webp`).toString('base64')}`;
  const inner = worldMarkup(stillInput(spec.T, { demo: spec.demo ?? null, cut: spec.cut ?? 0, reader: spec.reader ?? null }), { night });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${v.x} ${v.y} ${v.w} ${v.h}" role="img"><title>${spec.title}</title><rect x="${v.x}" y="${v.y}" width="${v.w}" height="${v.h}" fill="#10272D"/>${inner}</svg>`;
};
