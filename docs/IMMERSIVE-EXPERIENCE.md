# Immersive experience contract

This redesign supersedes the earlier split-lane, diagram-based implementation. The reader should feel inside one evolving landscape on desktop, tablet and mobile. The visual story is the primary experience.

## Composition

One viewport-filling canvas stays fixed behind the entire story. Native page scroll drives a continuous, reversible clock from 0 to 7. Each chapter has 145 small-viewport heights of travel; the last occupies one viewport. The renderer eases toward the actual scroll position over approximately 110 ms. Wheel and touch scrolling are never intercepted.

Desktop opening: centered title, two lines, at 25% viewport height. Subsequent copy: left 7.4%, top 30%, max 740px; body max 36 characters. Architecture occupies the right-hand valley. Mobile (700px and below): imagery continues behind everything, title/body overlay the foreground with 24px side margins and a 104px bottom reserve. The principal citadel occupies the upper 60%. There is no border or transition between an illustration area and a text area. Compact landscape screens get a smaller type scale; 400% reflow uses natural reading flow.

Typography: Source Sans 3 300 display, approximately 0.99 line height and -0.052em tracking; 400 body at 18–22px desktop / 17px mobile and 1.45–1.5 leading. Newsreader 400 wordmark. Named colors: abyss #061E24, forest #123E3B, jade #63B99B, mint #B5F5D2, bone #F4F0DF, solar gold #E5BC74. The central world carries the visual detail; interface chrome is quiet.

## Story clock

| Progress | Narrative | World behavior |
| --- | --- | --- |
| 0 | Another web is possible | Blue-hour valley, delicate direct connections, light moving between people |
| 1 | The middle moves in | Three detailed corporate citadels rise; routes bend through their foundations |
| 2 | Our attention, their empire | Citadels grow, gold moves inward and upward, invented corporate marks appear |
| 3 | The race gets a mind | A luminous machine eye forms around the main crown, extraction accelerates, landscape darkens |
| 4 | A different web starts between us | Direct routes return, mint tendrils bypass the middle, the eye dissipates |
| 5 | Small enough to belong | Towers descend and spread, their dominance fades, planted architecture begins appearing |
| 6 | A web in service of life | The same valley is inhabited by connected, human-scale communities |
| 7 | The future is something we make | Mature commons, an invitation to explore the writing or get in touch |

The river, mountains and foreground stay registered across the two environment plates. Tower silhouettes use transparent generated art and share the scene's camera composition and light. Fine luminous threads are perspective-scaled and drawn as continuously interpolated paths. There are 27 stable points and 41 relationships; no objects are recreated as chapters change.

Capture interpolates from 0.55–1.65. Tower rise spans 0.48–1.4; growth spans 1.4–3.15. The eye emerges at 2.55–3.05 and disappears over 3.85–4.5. Freedom grows over 3.7–5.05; citadels subside over 4.35–5.4; community life appears over 4.6–6.3. These offsets deliberately overlap so the result is a transformation, not eight isolated slides.

## Interaction and accessibility

Three optional exchanges demonstrate the contrast. In extraction, light travels into the platform and stays there. In reconnection, it travels directly and something returns. In the living commons, it continues through several relationships. Every outcome also appears as a short live text status. Leaving a chapter cancels its demonstration cleanly.

Explore opens a native modal with chapter links, simple reading mode, sources and the Markdown download. Escape closes it and focus returns to the opener. Invisible chapter controls are inert. The skip link enters simple reading mode. System reduced motion is honored on first paint; quiet mode stops ambient motion and shows deterministic scene states. Without JavaScript all eight passages remain readable. Print displays all passages in natural flow.

No flashing effects, autoplay audio, scroll hijacking, scroll traps, repeated card layouts, giant node labels, legends over the artwork or separate mobile illustration panels.

## Acceptance checks

1. Canvas bounds equal viewport bounds at 1440×900, 820×1180, 390×844, 320×740 and 844×390 for all eight beats.
2. At each settled beat, text remains inside the viewport and clear of header/footer controls; no horizontal overflow. Copy backgrounds remain transparent.
3. Only one canvas exists throughout. Reverse scroll recovers the same world state; relationships remain attached through route interpolation.
4. Capture precedes acceleration; direct connections return before the mature commons. No towers or eye remain at the end.
5. Both kinds of exchange visibly produce different outcomes and expose their result in text. Rapid navigation cancels old exchanges.
6. Chapter navigation, modal focus return, quiet mode, reduced motion, no-JavaScript reading, simple reading mode, 400% reflow and Markdown download work.
7. Browser console has no exceptions or failed production assets. Target p95 frame interval below 34ms in the local Chromium lab; real device performance is separately evaluated.
8. Total compressed production payload upper bound under 1.5MB and first-party JavaScript under 40KB. Three images only; no video or frame sequence.
9. Visual review must consider coherence, scale, atmosphere, copy alignment and mobile framing. Automated checks cannot certify the subjective beauty of the experience. The user's review remains the decisive aesthetic evaluation.
