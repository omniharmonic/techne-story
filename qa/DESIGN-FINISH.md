# Design completion and release

2026-10-06. Public static site: https://omniharmonic.github.io/techne-story/. Repository: https://github.com/omniharmonic/techne-story.

## Completed

- Generated registered day/night terrain plates: rocky terraces, moss, river, forest and atmospheric mountain distance. Optimized WebP assets are layered beneath the live world, blended through masks and timeline lighting. Original artwork and prompts are retained locally in `design/production-art/`.
- Resculpted the persistent tower segments with directional facets, curved seams, fissures and rim highlights. The same segments still unfurl into the community architecture. Painted forest replaces the flat foreground conifers.
- Positioned the reader and friend together in the foreground at the start. Widened the scroll transition window and removed duplicate easing. Stacked layouts settle the scene as its heading reaches the usable reading area.
- Tablets below 1100px use the stacked illustration and prose composition. Desktop retains the quiet text lane and full viewport landscape. Illustration controls and captions are kept clear of identity labels and the peak reservoir.
- Embedded compact painted plates in the standalone SVG stills so story mode, reduced motion, print and no-JavaScript reading retain the visual world.
- Replaced editorial placeholders with clearly imagined community possibilities and real Writing/Contact links. Removed unverified project-status claims and a culturally specific quotation that needed additional context. Added primary links for the collective-trap research, Spaces access control, PLC replicas and Baran’s original network diagrams. Original handoff remains preserved locally.
- Initialized the public repository and configured GitHub Actions to publish every push to `main` to GitHub Pages. No server or paid hosting service is required.

## Validation

- Production Astro build succeeded.
- All 14 identity and continuity tests passed on the final world model: reversible frames, persistent identities and architectural segments, migration attachments, counter-web ordering, monotonic extraction/acceleration, bounded ambient marks.
- All 50 browser behavior checks passed; results are recorded in `check-results.json`; release screenshots are in `design-finish/`. Desktop 1440×900, tablet 820×1180 and mobile 390×844 compositions were visually inspected.
- Transfer report: approximately 405 KB initial compressed transfer, 15 KB JavaScript, 76 KB fonts, 1.18 MB including every optional still. All project budgets pass.

## Verification limits

Design review here is an agent visual review, not independent human certification of the subjective art-quality gate. VoiceOver, Safari, Firefox and physical touch devices were not tested. The earlier Lighthouse report is historical, not a score for this release. Headless frame timing is a lab diagnostic, not a guarantee on every device. Direct private-call quotations and internal source documents are excluded from the public release. The communities are imagined possibilities rather than documented ecological outcomes.

The original handoff and initial QA report are local historical records; this document supersedes their launch placeholders and design status.

The initial push was rejected by automatic approval review because it included internal handoff and private-call source material. The release was narrowed to public implementation, production assets and validation evidence; private quotations were removed from the published narrative.

## Live deployment verification

GitHub Actions build and Pages deployment succeeded. The live URL returned HTTP 200. Browser checks of the deployed site passed at 1440×900, 820×1180 and 390×844: no horizontal overflow, the correct place endpoint, 24 people and 24 architectural segments, no failed requests or page errors. Both terrain plates, the standalone place SVG and the exact Markdown download responded successfully. No-JavaScript reading showed all 13 scenes and a loaded embedded still. Evidence: `live-check.json`. The complete local release suite was rerun after narrowing the narrative and passed all 50 checks.
