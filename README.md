# Techne — Another web is possible

An immersive, full-bleed story about moving from extraction to connection. Twenty-three short chapters across five acts travel through one cinematic river valley: a luminous peer network, rising corporate citadels, an accelerating eye, reconnection, and a planted solarpunk commons.

[Live experience](https://omniharmonic.github.io/techne-story/)

## Run

Node 24 is used in deployment.

```sh
npm ci
npm run dev
npm run build
npm run preview
npm test
npm run qa          # Chromium via Playwright; preview must be running
npm run qa:report
```

On a fresh machine, install the browser for QA with `npx playwright install chromium`.

## Implementation

- `src/lib/chapters.ts`: canonical narration, deeper chapter notes, source links and the narrative-to-world timeline.
- `src/lib/federation.ts`: golden-ratio local branches and peer-connected community hubs.
- `src/lib/immersive.ts`: stable people/relationships, reversible world state and route interpolation.
- `src/scripts/immersive.ts`: a single Canvas 2D compositor, native-scroll clock, responsive framing, atmosphere, architecture, eye, relay pavilions, enclosure walls, shared-asset exchanges, attention loops, public spheres, a botanical community federation, exchanges and accessible reading modes.
- `src/styles/immersive.css`: full-viewport composition and overlaid typography. No separate illustration window or opaque text panel.
- `src/pages/index.astro`: semantic story and optional chapter/source dialog.
- `public/art/immersive/`: three optimized production images. Citadel alpha is preserved; valley and commons share geography.
- `src/pages/story.md.ts`: a Markdown download generated from the same narrative data.
- `docs/IMMERSIVE-EXPERIENCE.md`: design and QA contract.
- `qa/immersive/`: current validation. Other QA files are historical and describe the superseded implementation.

Internal handoff documents and source art remain local under `design/`, excluded from the public repository. There are no analytics, cookies, remote fonts, runtime services or backend. GitHub Actions publishes the static `dist/` output to GitHub Pages under `/techne-story/`.
