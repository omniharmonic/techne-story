// Identity data for the one persistent world. Nothing here depends on the DOM,
// so the same module feeds the build-time stills, the live stage and the tests.

export type Pt = { x: number; y: number };
export type GroupId = 'A' | 'B' | 'C' | 'D';

/** Essential rectangle of the illustration, in world canvas units. */
export const E = { x: 0, y: 0, w: 1000, h: 860 };

/** Ground-plane world coordinates u,v in [0,1] to canvas units. */
export const ground = (u: number, v: number): Pt => ({ x: 70 + 860 * u, y: 255 + 560 * v });

/** Shared affine from the graph box (section 5 of the earlier spec) into the world. */
export const graphToWorld = (gx: number, gy: number) => ({ u: 0.04 + 0.92 * gx, v: 0.1 + 0.86 * gy });
export const graph = (gx: number, gy: number): Pt => {
  const w = graphToWorld(gx, gy);
  return ground(w.u, w.v);
};

export interface PersonNode {
  id: string;
  gx: number;
  gy: number;
  group: GroupId;
}

const OPEN: [number, number, GroupId][] = [
  [0.69, 0.94, 'A'], [0.16, 0.7, 'A'], [0.08, 0.49, 'A'], [0.2, 0.57, 'A'], [0.31, 0.75, 'A'], [0.29, 0.91, 'A'],
  [0.13, 0.25, 'B'], [0.3, 0.09, 'B'], [0.44, 0.04, 'B'], [0.48, 0.26, 'B'], [0.35, 0.37, 'B'], [0.23, 0.4, 'B'],
  [0.45, 0.55, 'C'], [0.49, 0.78, 'C'], [0.58, 0.95, 'C'], [0.77, 0.87, 'C'], [0.9, 0.91, 'C'], [0.84, 0.64, 'C'],
  [0.68, 0.54, 'D'], [0.73, 0.34, 'D'], [0.91, 0.4, 'D'], [0.88, 0.24, 'D'], [0.65, 0.09, 'D'], [0.84, 0.88, 'D'],
];

const pad = (n: number) => String(n).padStart(2, '0');

export const NODES: PersonNode[] = OPEN.map(([gx, gy, group], i) => ({ id: `n${pad(i + 1)}`, gx, gy, group }));
export const READER = 0; // n01
export const FRIEND = 23; // n24

export interface Relationship {
  id: string;
  a: number;
  b: number;
  kind: GroupId | 'bridge';
  /** Lexicographic index; fixes bend sign and capture order. */
  index: number;
}

const PAIRS: [number, number, GroupId | 'bridge'][] = [
  [1, 2, 'A'], [2, 3, 'A'], [3, 4, 'A'], [4, 5, 'A'], [5, 6, 'A'], [1, 6, 'A'],
  [7, 8, 'B'], [8, 9, 'B'], [9, 10, 'B'], [10, 11, 'B'], [11, 12, 'B'], [7, 12, 'B'],
  [13, 14, 'C'], [14, 15, 'C'], [15, 16, 'C'], [16, 17, 'C'], [17, 18, 'C'], [13, 18, 'C'],
  [19, 20, 'D'], [20, 21, 'D'], [21, 22, 'D'], [22, 23, 'D'], [23, 24, 'D'], [19, 24, 'D'],
  [1, 24, 'bridge'], [2, 12, 'bridge'], [3, 7, 'bridge'], [4, 13, 'bridge'], [5, 14, 'bridge'], [6, 15, 'bridge'],
  [8, 23, 'bridge'], [9, 22, 'bridge'], [10, 20, 'bridge'], [11, 19, 'bridge'], [16, 21, 'bridge'], [18, 24, 'bridge'],
];

export const EDGES: Relationship[] = PAIRS.map(([a, b, kind]) => ({ id: `e${pad(a)}-${pad(b)}`, a: a - 1, b: b - 1, kind, index: 0 }))
  .sort((p, q) => (p.id < q.id ? -1 : 1))
  .map((e, index) => ({ ...e, index }));

export const edgeIndex = (a: number, b: number) => {
  const id = `e${pad(Math.min(a, b) + 1)}-${pad(Math.max(a, b) + 1)}`;
  return EDGES.findIndex((e) => e.id === id);
};
export const FRIEND_EDGE = edgeIndex(READER, FRIEND);

/** The temporary 37th relationship formed by the Alive send (n04 to n01). */
export const TEMP_EDGE = { id: 'e01-04', a: 0, b: 3 };

// --- Landmarks (world u,v) -------------------------------------------------

export const RIVER: [number, number][] = [[0.52, 0.02], [0.6, 0.32], [0.48, 0.56], [0.56, 0.8], [0.44, 0.98]];

export interface Tower {
  id: 'T1' | 'T2' | 'T3';
  u: number;
  v: number;
  /** Base width and height in canvas units, low platform and megalith peak. */
  wLow: number;
  wPeak: number;
  hLow: number;
  hPeak: number;
  /** Village each half of the segments unfurls toward. */
  to: [number, number];
}

// Peak heights are .58 / .35 / .42 of a ~930 unit illustrated viewport.
export const TOWERS: Tower[] = [
  { id: 'T1', u: 0.68, v: 0.56, wLow: 190, wPeak: 176, hLow: 96, hPeak: 540, to: [2, 3] },
  { id: 'T2', u: 0.45, v: 0.45, wLow: 128, wPeak: 118, hLow: 62, hPeak: 325, to: [0, 1] },
  { id: 'T3', u: 0.87, v: 0.58, wLow: 138, wPeak: 128, hLow: 72, hPeak: 390, to: [3, 2] },
];

export const VILLAGES = [
  { id: 'V1', u: 0.27, v: 0.73, group: 'A' as GroupId },
  { id: 'V2', u: 0.43, v: 0.39, group: 'B' as GroupId },
  { id: 'V3', u: 0.68, v: 0.72, group: 'C' as GroupId },
  { id: 'V4', u: 0.86, v: 0.36, group: 'D' as GroupId },
];

export const LANDMARKS = {
  L1: { u: 0.57, v: 0.67, name: 'library pavilion' },
  L2: { u: 0.73, v: 0.79, name: 'assembly circle' },
  L3: { path: ['V1', 'V2', 'V3', 'V4'], name: 'common paths' },
};

/** Which owner each group is routed through during capture. */
export const OWNER: Record<GroupId, number> = { A: 0, B: 0, C: 1, D: 2 };

// Community ring radii in world u,v. The earlier spec's (.12,.13) graph radii
// are tightened so four rings fit the projected village sites without overlap.
export const RING = { ru: 0.085, rv: 0.1 };
const ANGLES: Record<GroupId, number[]> = {
  A: [135, 195, 255, 315, 15, 75],
  B: [135, 195, 255, 315, 15, 75],
  C: [135, 195, 255, 315, 15, 75],
  D: [135, 195, 255, 75, 15, 315],
};

export const openPos = (i: number): Pt => graph(NODES[i].gx, NODES[i].gy);

export const villagePos = (i: number): Pt => {
  const n = NODES[i];
  const g = 'ABCD'.indexOf(n.group);
  const k = i - g * 6;
  const a = (ANGLES[n.group][k] * Math.PI) / 180;
  const c = VILLAGES[g];
  return ground(c.u + RING.ru * Math.cos(a), c.v + RING.rv * Math.sin(a));
};

export const towerBase = (t: number): Pt => ground(TOWERS[t].u, TOWERS[t].v);
export const villageCenter = (g: number): Pt => ground(VILLAGES[g].u, VILLAGES[g].v);

/** Scene 7 demo homes and scene 11 recapture sites, in graph coordinates. */
export const HOMES: [number, number][] = [[0.15, 0.85], [0.45, 0.85], [0.75, 0.85]];
export const RISK_SITES: [number, number][] = [[0.35, 0.32], [0.56, 0.55], [0.74, 0.73]];

/** Final tower-segment destinations: village index, offset in u,v, and built form. */
export type SegForm = 'pavilion' | 'terrace' | 'bridge';
export interface SegDest {
  u: number;
  v: number;
  w: number;
  h: number;
  form: SegForm;
}

const around = (g: number, du: number, dv: number, w: number, h: number, form: SegForm = 'pavilion'): SegDest => ({
  u: VILLAGES[g].u + du,
  v: VILLAGES[g].v + dv,
  w,
  h,
  form,
});

// Eight per tower: indices 0,1 are the buttresses, 2..7 the stack from the base up.
export const SEG_DEST: SegDest[][] = [
  // T1 fans toward V3 and V4; one piece becomes the lower footbridge.
  [
    around(2, -0.115, -0.03, 46, 30), around(2, 0.12, -0.045, 44, 28),
    { u: 0.535, v: 0.735, w: 78, h: 22, form: 'bridge' }, around(2, -0.04, -0.14, 52, 34),
    around(2, 0.05, -0.135, 40, 30), around(3, -0.105, 0.075, 58, 16, 'terrace'),
    around(3, 0.02, 0.135, 40, 26), around(3, 0.1, 0.11, 34, 24),
  ],
  // T2 fans toward V1 and V2; one piece becomes the upper footbridge.
  [
    around(0, -0.1, -0.075, 42, 28), around(1, -0.115, -0.02, 40, 26),
    { u: 0.585, v: 0.265, w: 60, h: 16, form: 'bridge' }, around(0, -0.02, -0.14, 48, 32),
    around(0, 0.075, -0.115, 38, 26), around(1, -0.06, -0.125, 44, 28),
    around(0, 0.125, -0.02, 54, 15, 'terrace'), around(1, 0.045, -0.13, 34, 24),
  ],
  // T3 fans toward V4 and V3.
  [
    around(3, -0.09, -0.115, 40, 26), around(3, 0.085, -0.11, 38, 26),
    around(3, -0.005, -0.145, 50, 32), around(2, 0.125, 0.06, 56, 16, 'terrace'),
    around(3, 0.125, 0, 36, 24), around(2, -0.125, 0.07, 38, 26),
    around(2, 0.015, 0.135, 42, 26), around(3, -0.125, -0.03, 32, 22),
  ],
];

export const SCENES = [
  'open', 'peers', 'captured', 'flow', 'acceleration', 'leave-captured',
  'freed', 'homes', 'groups', 'alive', 'place', 'unfinished', 'techne',
] as const;
export type SceneId = (typeof SCENES)[number];
