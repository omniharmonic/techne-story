# Immersive experience contract

This redesign supersedes the earlier split-lane, diagram-based implementation. The reader should feel inside one evolving landscape on desktop, tablet and mobile. The visual story is the primary experience.

## Composition

One viewport-filling canvas stays fixed behind the entire story. Native page scroll drives a continuous, reversible narrative clock from 0 to 22, mapped continuously onto the existing world clock from 0 to 7. Each chapter has 145 small-viewport heights of travel; the last occupies one viewport. The renderer eases toward the actual scroll position over approximately 110 ms. Wheel and touch scrolling are never intercepted.

Desktop opening: centered title, two lines, at 25% viewport height. Subsequent copy: left 7.4%, top 25%, max 740px; body max 36 characters. Architecture occupies the right-hand valley. Mobile (700px and below): imagery continues behind everything, title/body overlay the foreground with 24px side margins and a 94px bottom reserve (104px for the opening/finale). The principal citadel occupies the upper 60%. There is no border or transition between an illustration area and a text area. Compact landscape screens get a smaller type scale; 400% reflow uses natural reading flow.

Typography: Source Sans 3 300 display, approximately 0.99 line height and -0.052em tracking; 400 body at 18–22px desktop / 16px mobile (17px opening) and 1.45–1.5 leading. Newsreader 400 wordmark. Named colors: abyss #061E24, forest #123E3B, jade #63B99B, mint #B5F5D2, bone #F4F0DF, solar gold #E5BC74. The central world carries the visual detail; interface chrome is quiet.

## World keyframes

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

Capture interpolates from 0.55–1.65. Tower rise spans 0.48–1.4; growth spans 1.4–3.15. The eye emerges at 2.55–3.05 and disappears over 3.85–4.5. Freedom grows over 3.7–5.05; citadels subside over 4.35–5.4; community life appears over 4.6–6.3. These offsets deliberately overlap so the result is a transformation, not isolated slides.

## Interaction and accessibility

Six optional exchanges demonstrate the contrast. A packet first travels between independent networks. In extraction, light travels into the platform and stays there. In reconnection, it travels directly and something returns. In the living commons, it continues through several relationships. Every outcome also appears as a short live text status. Leaving a chapter cancels its demonstration cleanly.

Explore opens a native modal with chapter links, simple reading mode, sources and the Markdown download. Escape closes it and focus returns to the opener. Invisible chapter controls are inert. The skip link enters simple reading mode. System reduced motion is honored on first paint; quiet mode stops ambient motion and shows deterministic scene states. Without JavaScript all twenty-three passages remain readable. Print displays all passages in natural flow.

No flashing effects, autoplay audio, scroll hijacking, scroll traps, repeated card layouts, giant node labels, legends over the artwork or separate mobile illustration panels.

## Acceptance checks

1. Canvas bounds equal viewport bounds at 1440×900, 820×1180, 390×844, 320×740 and 844×390 for all twenty-three beats.
2. At each settled beat, text remains inside the viewport and clear of header/footer controls; no horizontal overflow. Copy backgrounds remain transparent.
3. Only one canvas exists throughout. Reverse scroll recovers the same world state; relationships remain attached through route interpolation.
4. Capture precedes acceleration; direct connections return before the mature commons. No towers or eye remain at the end.
5. Both kinds of exchange visibly produce different outcomes and expose their result in text. Rapid navigation cancels old exchanges.
6. Chapter navigation, modal focus return, quiet mode, reduced motion, no-JavaScript reading, simple reading mode, 400% reflow and Markdown download work.
7. Browser console has no exceptions or failed production assets. Target p95 frame interval below 34ms in the local Chromium lab; real device performance is separately evaluated.
8. Total compressed production payload upper bound under 1.5MB and first-party JavaScript under 40KB. Three images only; no video or frame sequence.
9. Visual review must consider coherence, scale, atmosphere, copy alignment and mobile framing. Automated checks cannot certify the subjective beauty of the experience. The user's review remains the decisive aesthetic evaluation.

## Expanded educational arc

The approved opening is preserved: identical copy, terrain, camera, typography, network, and composition at progress zero. All added illustration layers have zero opacity there. Twenty-three chapters form five acts: Origins, Enclosure, The human cost, Acceleration, and A living web. Each main passage remains under 48 words. Non-opening chapters show the act and position; Explore groups navigation by act.

`src/lib/chapters.ts` is the canonical content and pacing map. Its `scene` values are monotonic and interpolate linearly; the existing world functions retain their smooth transitions. Mechanism layers blend around their narrative positions, reverse with scrolling, and use the same world projection.

- Origins: illuminated relay pavilions, joining ripples, packet routes, published pages and cross-links.
- Enclosure: useful hubs become dominant; layered elliptical walls and vertical gates appear around their foundations. Homes and vehicles show participant-owned assets whose exchanges are routed through the platform; capital streams move toward growing towers.
- Human cost: orbiting attention prompts pull against a person's own rhythm; livelihoods depend on gate paths; separate public spheres connect to private control centers.
- Acceleration: the machine eye gains reaching filaments, synchronized gold pulses and capture rings across the network.
- A living web: filaments release, direct paths return, golden-ratio branches and nested peer-connected community hubs accompany the planted commons.

Each intermediate chapter has a Look closer button. Its native modal provides mechanism, context, and chapter-specific primary sources, while pausing the world. Escape restores focus to that chapter's button. All notes and source links also appear in the Markdown download. Reduced motion produces static illustrations and immediate exchange outcomes.

Editorial constraints: distinguish internet transport from platform architecture, private equity from venture capital and public share ownership, data from wealth, risk scenarios from inevitability, and empirical findings from normative proposals. Do not label every named platform a legal monopoly or imply algorithms alone cause polarization. The story's financial and social argument should remain clear without treating metaphors as evidence.

Compact landscape layouts place the note button beside the exchange control, reserving the lower edge for navigation. All twenty-three chapters and twenty-one note dialogs are included in browser QA. The hero content is separately regression-tested.

## Techne and the living federation

The financial detour is replaced with the sharing-economy pattern: participants contribute rooms, vehicles, work and relationships; platforms provide coordination and can enclose access to the resulting network. Private capital and the profit motive can intensify extraction at digital scale. Airbnb and Uber illustrate platform intermediation, not a claim about their current private-equity ownership or legal monopoly status.

The final act now explains the Techne SDK as a proposed distribution layer, local AI-assisted app remixing, cooperative stewardship, federated reach, local reciprocity and the funding invitation. The SDK is a proof of concept; companion services and lexicons appear in the optional note only. No public SDK link, adoption statistics, partner commitments, funding target or released capability is invented. The primary final link opens an email to discuss funding.

The early relay-pavilion illustration never returns at the end. Five stable community hubs each have three local branches and five leaves per branch, with scale ratios derived from phi. Seven peer links avoid a single central distributor. Soft nested petal forms replace hard enclosure walls. Branches grow across the SDK/remix/federation chapters, exchanging light in both directions. Regional arcs are open, not enclosing borders. These forms represent the proposed social architecture, not AT Protocol server topology.

Two new demonstrations show a remix keeping its shared connections, and peer communities exchanging across the federation. Their textual outcomes remain available with reduced motion. The original landscape, hero layout and hero contrast gradient remain intact.
