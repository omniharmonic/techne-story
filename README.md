# Techne story

A static, scroll-driven illustrated story in four acts (Open, Captured, Freed, Alive). One persistent SVG world changes as the reader scrolls; the same 24 people, 36 relationships and 24 architectural segments exist from the first frame to the last.

Published at Benjamin Life’s direction: https://omniharmonic.github.io/techne-story/

## Run it

Requires Node 22.18 or later.

```sh
npm install
npm run dev        # http://localhost:4321/techne-story/
npm run build      # static output in dist/
npm run preview    # serves dist/ at http://localhost:4321/techne-story/
npm test           # identity and continuity tests for the world model
npm run qa         # screenshots, behaviour checks, recordings (needs `npm run preview` running)
npm run qa:report  # transfer report and layer/landmark manifest
```

Dependencies and build output are excluded from Git. Use `npm ci` to install the locked dependency versions on a fresh checkout.

## Where things are

| Path | What it is |
| --- | --- |
| `src/content/story.md` | The one canonical story file. The page and the Markdown download are both built from it. |
| `src/lib/world/data.ts` | Identities: people, relationships, towers, villages, landmarks, segment destinations. |
| `src/lib/world/timeline.ts` | Exact endpoint definitions: every world quantity as keyframes over the timeline `T` (0 to 12). |
| `src/lib/world/art.ts` | The static illustrated world, built once as an SVG tree. |
| `src/lib/world/frame.ts` | `computeFrame(T, reader actions)`: attributes for the persistent elements. Pure and deterministic. |
| `src/scripts/controller.ts` | Scroll to `T`, layout fitting, demos, reading modes. |
| `src/pages/stills/[name].svg.ts` | Still figures rendered from the same model (story mode, reduced motion, no JavaScript, print). |
| `src/components/Demo.astro` | Interactive controls and their text outcomes, per scene. |
| `design/` (local only) | Internal design handoff, reference boards and generated source artwork. Excluded from the public repository. |
| `qa/` | Evidence: `REPORT.md`, screenshots, intermediate frames, recordings, check results, manifest, transfer report. |
| `HANDOFF-TO-DESIGN.md` (local only) | Historical internal implementation handoff, excluded from the public repository. |
| `licenses/` | SIL Open Font License texts for Newsreader and Source Sans 3 (self-hosted via Fontsource). |

## How it works

Scroll position maps to one number, `T`. Integer `k` is the endpoint of scene `k`; the interval before it is the transition into that scene. `computeFrame` turns `T` into attribute values for elements that already exist, and the controller writes only the attributes that changed. Nothing accumulates between frames, so backward scroll, deep links, reload and resize all derive the same world. The build calls the same function to produce the still figures.

## Deployment

Static output for GitHub Pages under the base path `/techne-story/` (`astro.config.mjs`). `.github/workflows/deploy.yml` follows the current Astro recipe and runs on pushes to `main` and can also be triggered by hand. Before the first run: create the repository, enable Pages with "GitHub Actions" as the source, and set the repository variable `SITE_ORIGIN` (for example `https://<owner>.github.io`). If the repository name is not `techne-story`, change `base` to match. Repository: https://github.com/omniharmonic/techne-story.

No backend, analytics, cookies, remote fonts or runtime service calls.

## Design completion

See `qa/DESIGN-FINISH.md` for the final validation and known verification limits. The original handoff and QA report are retained locally as historical records. Production uses AI-generated day/night terrain plates beneath the live SVG; source art and prompts are retained locally in `design/production-art/`. Imagined communities are labeled as possibilities. Unverified project claims were replaced with hypothetical uses, and the final links point to the existing Techne writing and Benjamin’s contact address.
