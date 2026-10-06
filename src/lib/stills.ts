// Still figures: one per scene endpoint, plus the outcome of each recurring send.
// They are rendered from the same world model as the live stage.

import { DEMO_MS, type DemoState } from './world/frame.ts';
import type { StillSpec } from './world/render.ts';

const send = (kind: DemoState['kind']): DemoState => ({ kind, ms: DEMO_MS[kind] });

export const STILLS: Record<string, StillSpec> = {
  open: { T: 0, title: 'The open web of peers at night' },
  peers: { T: 1, title: 'The same web, with relationships running both ways' },
  captured: { T: 2, title: 'Three low platforms with every relationship routed through them' },
  flow: { T: 3, title: 'Amber value rising into reservoirs on the platforms' },
  acceleration: { T: 4, title: 'The platforms grown into megaliths, linked by a lavender feedback ribbon' },
  'leave-captured': { T: 5, title: 'The megaliths at their height' },
  freed: { T: 6, title: 'Direct relationships re-formed beneath the megaliths' },
  homes: { T: 7, title: 'Three small homes among the people while the towers still stand' },
  groups: { T: 8, title: 'Four communities at dawn, the towers unfurled into shared buildings' },
  alive: { T: 9, title: 'Relationships brightening across four communities' },
  place: { T: 10, title: 'An imagined living landscape in daylight' },
  unfinished: { T: 11, title: 'Three small platforms beginning to bend nearby relationships' },
  techne: { T: 12, title: 'The living landscape, with a line from the reader waiting' },
  'open-after': { T: 0, demo: send('send-open'), title: 'After sending in the open web' },
  'captured-after': { T: 2, demo: send('send-captured'), title: 'After sending through the platform' },
  'freed-after': { T: 6, demo: send('send-freed'), title: 'After sending once the middle is taken out' },
  'alive-after': { T: 9, demo: send('send-alive'), title: 'After a gift has traveled on and returned' },
  'leave-after': { T: 5, cut: 1, reader: { gx: 0.04, gy: 0.94 }, title: 'After leaving a platform: every connection cut' },
  'migrate-after': { T: 6, reader: { gx: 0.18, gy: 0.88 }, title: 'After moving homes: every relationship holds' },
};
