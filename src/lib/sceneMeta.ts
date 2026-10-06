// Words that describe the illustration. They are the text alternative for the
// stage, the captions of the still figures, and what a reader who never sees
// motion relies on.

export const CAPTIONS: Record<string, string> = {
  open: 'A night valley with a winding river. Twenty-four people, shown as warm beads, are joined by direct lines. You are the copper bead with a double ring. Your friend is the sage bead with an ivory ring.',
  peers: 'The same people and lines. Gifts travel both ways along them, and where many paths cross a pattern briefly forms.',
  captured: 'Three low, welcoming platforms have risen at fixed sites. Every line now bends through a platform before it reaches the other person.',
  flow: 'Amber beads rise from the base of each platform into a reservoir at its top. The lanterns of the shared places are dimmer.',
  acceleration: 'The same three platforms have grown into towers that dwarf the people. A thin lavender ribbon loops between them, and their shade covers the library, the meeting circle and the paths between communities.',
  'leave-captured': 'The towers at full height, their reservoirs nearly full. Every relationship still passes through them.',
  freed: 'The towers still loom. Beneath them, you and your friend are joined by a direct line again, and other direct lines have followed. Four small pieces have come apart from the largest tower: your name, what you have made, finding people, viewing things.',
  homes: 'Three small homes sit among the people. The towers still stand, but less flows into them and seams have begun to open in their walls.',
  groups: 'Dawn. The towers have divided along their seams into pavilions, terraces and footbridges, and the same people have gathered into four communities with porous edges.',
  alive: 'The four communities in early light. The lines within and between them are brighter, and nothing routes them.',
  place: 'An imagined living landscape in daylight: gardens, groves and shared buildings around four communities, with relationships running directly across the river.',
  unfinished: 'The same landscape. In three places a small platform has appeared, and nearby lines have begun to bend toward it.',
  techne: 'The living landscape holds. A dashed line extends from your bead toward a neighboring community and waits.',
};

export const PAIRS: Record<string, { before: [string, string]; after: [string, string] }> = {
  open: {
    before: ['open', 'Before: you and your friend, joined by one direct line.'],
    after: ['open-after', 'After: your gift reached your friend along that line, and something came back the same way.'],
  },
  captured: {
    before: ['captured', 'Before: your line to your friend runs through two platforms.'],
    after: ['captured-after', 'After: the platform kept a copy, shown as a dashed ring. Your friend received your message with a diamond beside it: something else chosen by the platform. Nothing came back directly.'],
  },
  freed: {
    before: ['freed', 'Before: a direct line again, beneath the towers.'],
    after: ['freed-after', 'After: it went directly and a reply came back. A copy rests beside you, in the home you chose.'],
  },
  alive: {
    before: ['alive', 'Before: four communities, joined by direct lines.'],
    after: ['alive-after', 'After: your gift went to your friend, then on through three other people. A new line has formed from someone you had not met, back to you.'],
  },
  'leave-captured': {
    before: ['leave-captured', 'Before: your lines all pass through a tower.'],
    after: ['leave-after', 'After leaving: your bead sits outside and every one of your lines is cut. Your friends are still lit, out of reach.'],
  },
  'freed-move': {
    before: ['freed', 'Before: you, in the home you chose.'],
    after: ['migrate-after', 'After moving homes: your bead has moved, and every line stretched and held.'],
  },
  acceleration: {
    before: ['flow', 'Before: three small platforms.'],
    after: ['acceleration', 'After: the same three platforms, grown into megaliths. This illustration explores a risk, not an inevitable outcome.'],
  },
  groups: {
    before: ['leave-captured', 'Before: value drawn up into three towers.'],
    after: ['groups', 'After: the same structures divided into shared buildings among four communities. An imagined possibility.'],
  },
};

export const LONG_TITLES = new Set(['captured', 'place']);
