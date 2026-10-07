# Immersive experience contract

## Editorial direction

Nineteen chapters restore the original extended arc: 596 narration words versus 734 (18.8% shorter). The approved opening remains unchanged. Combine only the related enclosure/convenience, choice/reconnection, portability/SDK and funding/future passages. Keep the original emotional sequence: origins, open Web, enclosure, sharing, enshittification, attention, inner life, livelihoods, democracy, AI, Moloch, reciprocity, SDK, remixing, stewardship, federation, living places, invitation. Sources and qualifications remain in Look closer and the Markdown download.

Use concrete subjects and connected sentences. Avoid repeating the same claim as another chapter or adding ornamental slogans. Supporting history, qualifications and sources belong in Look closer and the Markdown download. Keep the distinction between the proposed Techne architecture and released capabilities. Do not invent adoption, partners, funding targets or investment returns.

## Composition and camera

The landscape fills the viewport. There is one persistent canvas, with native page scrolling and overlaid HTML narration. No wheel interception, illustration panels or card layout. `src/lib/camera.ts` defines the single cover transform for the 1672×941 artwork, including crop, focal position and scroll-driven camera motion.

Towers, people, federation branches, mist and river lights use normalized artwork coordinates through that same camera. The background and overlays must never independently scale with viewport percentages. All screen sizes use the same authored landmarks. The five hubs sit at (0.487, 0.525), (0.582, 0.818), (0.665, 0.448), (0.902, 0.585), and (0.908, 0.369): the central dome, foreground greenhouse, distant settlement, right terrace and upper plateau. Portrait viewports crop this world; they must never lift those anchors into the sky. Tower sizes share one scale constraint, preserving their relative hierarchy while keeping the primary crown in view on ultrawide screens.

Desktop copy sits at left 7.4%, top 25%, max width 740px. The opening remains centered. Phones use 24px side margins and a lower foreground text overlay. The environment remains visible behind it. Compact landscape viewports place chapter notes beside exchange controls. At 400% reflow, use natural reading flow.

The animated canvas is capped at two million backing pixels to limit ultrawide rendering cost; overlaid HTML remains at native resolution. Non-opening headings cap at 96px to preserve text clearance.

Typography remains Source Sans 3 light display and regular body; Newsreader wordmark. Palette: abyss #061E24, forest #123E3B, jade #63B99B, mint #B5F5D2, bone #F4F0DF, solar gold #E5BC74.

## Continuous motion

Nineteen narrative positions map continuously to the existing world clock 0–7. Scroll position is eased over approximately 110ms. World state is reversible. The same terrain changes from open valley to concentrated corporate power and then a planted commons.

Early relay stations and linked pages fade into walls and captured routes. Value moves into growing towers. The machine eye and reaching filaments intensify before direct routes return. Five community hubs grow fifteen branches and seventy-five leaves scaled by phi, joined by seven peer links. These are social metaphors, not a literal AT Protocol server diagram.

Ambient layers: ten reusable procedural cloud banks drift at different depths, with five finer secondary strands; restrained gold reflections move on the river; motes and reciprocal network pulses continue while the reader pauses. Community petal forms breathe by 7%, with a visible expanding ground-plane ring every 3.7 seconds. Motion must be calm enough for reading. All ambient motion stops in quiet mode, reduced motion, hidden tabs or open dialogs. No video or new raster payload is required.

## Distinct visual eras

- Early internet: cool blue packet lights, dotted open links, separate relay pavilions and linked pages. No dominant center. The packet and Web chapters have separate illustrations.
- Web 2: gold paths converge on citadels; concentric enclosure rings and asset gateways give way to attention loops, interrupted personal rhythms, livelihood tolls and privately mediated public squares. Platform buildings stay modest through the democracy passage. AI introduces vertical growth, the eye and reaching tendrils; Moloch alone reaches full megalith scale and adds tightening rings competing around all three towers.
- Distributed web: the old network fades completely. Shared records cross between community hubs, apps vary locally, stewardship circulates value within each place, and connections gradually extend into botanical federation. Mint/gold reciprocity replaces the single inward flow.

Keep all these mechanisms grounded in the same authored landmark coordinates. Public-square illustrations must also follow the landscape camera. Text remains fully visible across 60% of each chapter interval, so the restored narrative has time to breathe. Reversing scroll reverses scene development. Clouds and local pulses keep moving during reading pauses.

### Narration-to-animation gates

| Passages | Architecture and motion |
| --- | --- |
| Connection, packets, open Web | No corporate towers; independent stations and open links |
| Private gates, sharing, returns | Small platform structures and enclosing gateways; no eye |
| Attention, inner life, livelihoods, democracy | Structures stay modest; distinct human-scale mechanisms |
| AI acceleration | Towers begin substantial vertical growth; eye and tendrils emerge |
| Moloch | Full tower height, full eye, competing contraction rings |
| Reconnection onward | Eye recedes, routes bypass the gates, local reciprocal networks develop |

A regression test evaluates the actual chapter scene positions: no monumental growth or eye in any pre-AI passage. Do not use a chapter-count-independent timer that can outrun the narration.

## Interactions and access

Six optional demonstrations cover packet delivery, extraction, reciprocal exchange, remixing, federation and local sharing. Outcomes are also exposed as live text; leaving a chapter cancels its demonstration. Quiet mode resolves them immediately.

Explore groups chapter links by act. Look closer opens a native modal with source links and restores focus on close. Invisible chapter controls are inert. Reading mode and no-JavaScript content expose the complete narrative. The download uses the same canonical content. Old chapter URLs map to their consolidated successors. The final funding link opens an email conversation.

## Acceptance

- Check every chapter at 320×740, 390×844, 820×1180, 844×390, 1440×900, 1920×1080, 2560×1440 and 3440×1440.
- Text and controls clear header/footer; no horizontal overflow; one full-bleed canvas.
- Verify artwork-space registration mathematically and visually. Resize must not make a tower or hub detach from its terrain location.
- Verify all six exchanges, chapter notes, sources, keyboard focus, reverse navigation, deep links, reading modes and Markdown download.
- Test ambient movement and quiet-frame stability. Target local p95 frame intervals below 34ms; do not equate a lab result with universal device performance.
- Compressed production payload under 1.5MB; first-party JavaScript under 40KB.
- Visual review includes wide-screen tower hierarchy, integrated mist, mobile framing and the organic finale. Automated checks do not certify subjective beauty.
