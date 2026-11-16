# Casino background plate — 2.5D implementation

## Scope
The camera, table, dealer, cards, chips, subtitles, lesson progression and persistence are unchanged. The old Room wall/trim/pillars/pendant meshes are replaced with a generated casino-floor plate and the existing floor plane becomes a transparent shadow receiver. Foreground lights retain their original positions, colors and intensities. No new real-time light or shadow map is added.

`CasinoBackdrop.tsx` loads a local WebP into the Three.js scene background, fits its aspect ratio without stretching, and keeps its top aligned on landscape screens. Background intensity is 0.72. Warm distance fog joins the floor and plate. Texture failure leaves a warm neutral background; the lesson continues. No API or third-party image host is contacted by visitors.

## Asset provenance and use
- File: `public/assets/casino-floor.webp` (260,598 bytes; 1672 × 941).
- Created for this project on 2026-11-16 with the built-in OpenAI image generation tool. This is an AI-generated fictional casino, not a photograph of a real venue.
- The user's attached reference was used as visual direction: warm chandeliers, walnut columns, green gaming tables, tan chairs, carpet and architectural depth. The attached file itself is not distributed or copied into the repository. Generation used a text brief for a new room, without uploading the reference image to the generation call.
- No purchased asset, external paid API, API key or new service account was used.
- OpenAI Terms of Use, Content / Ownership of content: https://openai.com/policies/terms-of-use/ (checked 2026-11-16). These assign OpenAI's rights in generated output to the user to the extent permitted by law; this asset is distributed as project output, not mislabeled as a CC0 stock photograph. No third-party attribution requirement was identified. These terms do not guarantee uniqueness or third-party rights clearance.
- PNG was converted to WebP at quality 0.85 using Chrome's standard canvas encoder. No external source image was bundled.

## Performance
- Extra compressed image transfer: 254.5 KiB, loaded only with the immersive 3D scene.
- One background texture, no mip chain; approximately 6.0 MiB RGBA texture memory before driver overhead.
- Removed 36 background meshes; retained the floor shadow receiver. Rendering the image requires a background pass. No additional lights, shadow maps, postprocessing, character animation, or model downloads.
- Pages 3D chunk: about 949.95 KB, gzip 255.68 KB (previous ~950.89 KB / 255.70 KB). Existing >500 KB chunk warning remains.
- No claim of improved FPS: physical iOS/Android frame-time and GPU-memory measurements have not been made.

## Validation
- Existing 63 unit tests passed.
- All 12 browser tests passed at desktop/mobile-landscape sizes, including WebGL fallback and learning history.
- Dedicated background-request failure test verifies card interaction remains available.
- Normal and GitHub Pages builds passed. Pages configuration unchanged.
- Local comparisons: `docs/screenshots/casino-before-desktop.png`, `casino-after-desktop.png`, `casino-before-mobile.png`, `casino-after-mobile.png` (QA artifacts, not required for runtime).

## Limits
This is a fixed-view background plate with a 3D shadow receiver, not a fully modeled room. Parallax during the existing entrance camera motion is approximate. Distant figures and chandeliers are static; no ambience audio has been added. The existing dealer's unfinished anatomy remains unchanged. Most of the background is naturally occluded by the foreground table at desktop widths. Refinements should remain limited to plate composition/registration and must not move the existing camera to expose more scenery.
