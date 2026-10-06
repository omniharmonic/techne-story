// Layer / landmark / identity manifest, generated from the world model.
import { writeFileSync } from 'node:fs';
import { EDGES, HOMES, LANDMARKS, NODES, OWNER, RISK_SITES, RIVER, SCENES, SEG_DEST, TOWERS, VILLAGES, E, ground, openPos, villagePos } from '../src/lib/world/data.ts';
import { RISK_EDGES } from '../src/lib/world/frame.ts';
import { TRACKS } from '../src/lib/world/timeline.ts';

const pt = (p: { x: number; y: number }) => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 });
const manifest = {
  generated: new Date().toISOString(),
  coordinateSystems: {
    world: 'u,v in [0,1] on the ground plane; canvas x = 70 + 860u, y = 255 + 560v',
    graph: 'graph box gx,gy in [0,1]; u = .04 + .92gx, v = .10 + .86gy (one shared affine)',
    essentialRect: E,
    camera: 'scale about canvas (560,300); keyframes in timeline.camera, pan in panX/panY',
  },
  layers: [
    ['pFar', 'distant plane: sky, sky glow, two mountain ranges, far hills, haze'],
    ['pMid / terrain', 'ground, rolling swells, plateaus, river (bank, water, glints)'],
    ['pMid / civic', 'L3 common paths, existing footbridge, L1 library pavilion, L2 assembly circle, lanterns, huts'],
    ['pMid / treesBack', 'conifer scatter (deterministic seed 20261006)'],
    ['pMid / gardens, groves', 'village beds and groves that grow in Alive 9 to 10'],
    ['pMid / shade', 'shade over L1, L2 and L3 during the acceleration'],
    ['pMid / rings', 'four porous community perimeters'],
    ['pMid / ribbonBack', 'back halves of the three lavender feedback loops'],
    ['pMid / towers', 'per tower: cast shade, foundation, courtyard, 8 segments, channel, reservoir'],
    ['pMid / ribbonFront', 'front halves of the feedback loops, with direction ticks'],
    ['pMid / routes', '36 relationships (casing + line), temporary 37th, waiting line, 6 demo highlights'],
    ['pMid / glyphs', 'recapture sites, community hosts, demo homes, function pieces and lenses'],
    ['pMid / people', '24 person beads n01..n24'],
    ['pMid / marks', '6 amber extraction beads, 3 reciprocal pulses, gift, copy, diamond, square, record'],
    ['pFg', 'foreground conifer silhouettes'],
    ['labels', 'you, your friend, demo labels (screen-sized)'],
    ['HTML', 'header, act navigation, narrative, controls, statuses, captions'],
  ].map(([id, contents], order) => ({ order, id, contents })),
  landmarks: {
    river: RIVER.map(([u, v]) => ({ u, v, canvas: pt(ground(u, v)) })),
    L1: { ...LANDMARKS.L1, canvas: pt(ground(LANDMARKS.L1.u, LANDMARKS.L1.v)) },
    L2: { ...LANDMARKS.L2, canvas: pt(ground(LANDMARKS.L2.u, LANDMARKS.L2.v)) },
    L3: LANDMARKS.L3,
    towers: TOWERS.map((t) => ({ ...t, canvas: pt(ground(t.u, t.v)), unfurlsToward: t.to.map((g) => VILLAGES[g].id) })),
    villages: VILLAGES.map((v) => ({ ...v, canvas: pt(ground(v.u, v.v)) })),
    demoHomes: HOMES.map(([gx, gy], i) => ({ id: `home${i}`, label: `Home ${'ABC'[i]}`, gx, gy })),
    recaptureSites: RISK_SITES.map(([gx, gy], i) => ({ id: `risk${i}`, gx, gy, bends: RISK_EDGES[i].map((e) => EDGES[e].id) })),
  },
  people: NODES.map((n, i) => ({ id: n.id, role: i === 0 ? 'you' : i === 23 ? 'your friend' : undefined, group: n.group, owner: TOWERS[OWNER[n.group]].id, open: { gx: n.gx, gy: n.gy, canvas: pt(openPos(i)) }, community: pt(villagePos(i)) })),
  relationships: EDGES.map((e) => ({ id: e.id, a: NODES[e.a].id, b: NODES[e.b].id, kind: e.kind, order: e.index, capturedVia: [...new Set([TOWERS[OWNER[NODES[e.a].group]].id, TOWERS[OWNER[NODES[e.b].group]].id])] })),
  temporaryRelationship: { id: 'e01-04', a: 'n01', b: 'n04', appears: 'Alive send only, final step' },
  segments: TOWERS.flatMap((t, ti) => SEG_DEST[ti].map((d, s) => ({ id: `${t.id}-0${s + 1}`, tower: t.id, role: s < 2 ? 'buttress' : `stack ${s - 1} of 6 (base up)`, becomes: d.form, at: pt(ground(d.u, d.v)), size: { w: d.w, h: d.h } }))),
  scenes: SCENES.map((id, T) => ({ T, id })),
  timeline: { note: 'T = k is the endpoint of scene k; (k-1,k) is the transition into it. Each track is [T, value] keys with smoothstep between keys.', tracks: TRACKS },
  bounds: { people: 24, relationships: 36, temporaryRelationships: 1, segments: 24, reservoirs: 3, depthPlanes: 3, extractionBeads: 6, reciprocalBeads: 3 },
};
writeFileSync('qa/layer-landmark-manifest.json', JSON.stringify(manifest, null, 2));
console.log('manifest:', manifest.people.length, 'people,', manifest.relationships.length, 'relationships,', manifest.segments.length, 'segments');
