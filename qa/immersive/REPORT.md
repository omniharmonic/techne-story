# Immersive release validation — 2026-10-06

This report applies to the continuous-landscape redesign, replacing the previous split composition.

- Production Astro build: passed.
- Pure narrative/state/route tests: 9 passed.
- Chromium browser checks: 30 passed, 0 failed. Full details in `checks.json`.
- Viewports: 1440×900, 820×1180, 390×844, 320×740, and 844×390; all eight chapters checked at each.
- All three exchange outcomes, cancellation, chapter navigation, modal focus return, quiet mode, system reduced motion, simple reading, no-JavaScript reading, 400% reflow, deep links, and canonical Markdown download passed.
- Scroll frame interval: 18.1ms p95, no intervals over 50ms in the local Chromium sample. This is a lab observation, not a promise about every device.
- Compressed production payload upper bound: 980,950 bytes; JavaScript: 6,037 bytes; generated artwork: 899,372 bytes. Gzip text plus native image/font sizes; details in `transfer.json`.

Visual review inspected opening, corporate peak, and planted commons on desktop, tablet, and phone, plus the intermediate transformation at progress 4.7. Copy overlays the same full-bleed environment throughout. Six representative desktop/phone screenshots are retained here.

Safari, VoiceOver, and physical low-end devices were not tested. Automated geometry/state checks do not establish subjective aesthetic quality; the user's visual assessment remains decisive.
