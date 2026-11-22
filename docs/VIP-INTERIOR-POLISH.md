# VIP room final interior polish

## Scope

Only `VipRoom.tsx` and its new `vipSurfaceTextures.ts` helper change runtime behavior. Camera, table, rail, chairs, dealer, cards, chips, captions, lessons and persistence are unchanged. No new furniture, background image, package or paid service.

## Carpet

Original code-generated 512×512 woven texture: muted diamond lattice with small four-lobed woven motifs, fine alternating threads and deterministic fibre variation. Repeat 23.5×30.42 across the existing 12.9×16.7 floor: about 0.55 scene units per motif on both axes. The dimensions are existing scene units, not calibrated metres. Periodic geometry avoids tile seams. Burgundy material #99616e, roughness 1, bump scale 0.003 (previously 0.016). Cloth on walls retains its own existing texture.

## Walls

Reuse existing CC0 Poly Haven Wood Table 001 (Dimitrios Savva / Rico Cilliers); source/license in public/assets/vip-room/README.md. PBR maps retain one consistent UV transform. Timber cuts use physical geometry coordinates (2.4×3.6 scene-unit texture scale) rather than stretching a full image to every board. Vertical panels retain vertical grain and long rails use horizontal grain. Wood normal strength reduced from 0.35 to 0.16; trim roughness 0.90. Antique brass roughness 0.49.

Panel frames have a 0.075 rim instead of 0.055 and a restrained second recessed moulding. All additional profiles are merged into the existing material batches. Skirting extends precisely to floor y=-1, with the stepped cap retained. Room dimensions do not change.

## Light

Two generated indirect-light approximations: 256×256 floor map and 768×256 atlas for left/rear/right walls. Separate UV1 avoids changing wood grain or carpet repeat. Static warm gradients align with existing sconces/cove lighting; floor map includes broad table and chair occlusion. These are authored approximations, **not physically ray-traced light bakes**. Existing real-time lights, key light, shadow resolution and exposure are unchanged, preserving card visibility and dealer shading. Sconce shade emission is reduced 0.8→0.65. The soft floor contact overlay is less opaque (centre 0.65→0.48) to avoid crushing carpet detail.

## Validation

Same River lesson, unchanged camera, after cards settle: 1440×900, 844×390 and 667×375. Local comparison images: docs/screenshots/interior-polish/{before,after}/{1440,844,667}.png. No page errors in any of the six captures.

Unit tests: 72 passed. Pages-targeted production build passed; existing >500KB chunk warning remains. Existing browser suite: 14 passed, including all lessons/quizzes, progress persistence, 52-card assets, WebGL fallback and failed wood-image loading.

Same River-scene renderer counters: calls 125→125; triangles 75,914→77,258 (+1,344); textures 26→29. Three additional generated GPU textures total approximately 2.33MiB including carpet mipmaps; no additional image download. No new shadow maps or real-time lights. JS 3D chunk adds about 1.1KB gzip versus the previous build. Desktop headless Chrome measured a median 16.7ms rAF interval at both 1440×900 and 844×390 (same as the previous version); these are local viewport measurements, not mobile hardware benchmarks.

## Remaining limits

Mobile sizes are desktop Chrome viewport emulations, not physical-phone GPU/thermal measurements. Static indirect lighting does not model full light transport. Very low display brightness can still hide fine weave detail. Dealer anatomy remains the previous implementation and is not claimed as improved here. The fixed downward view limits how much of the room is visible; no camera adjustment was made to showcase the interior.
