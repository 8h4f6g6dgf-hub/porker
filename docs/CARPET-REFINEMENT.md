# Carpet texture and foreground bounce

## Changes

Original 1024px CanvasTexture damask, drawn from mirrored Bezier palmettes, acanthus leaves, scrolls and pendants. No external artwork, paid assets or additional downloads. Half-drop repeat includes wrapped corner copies; deterministic fibre variation gives a matte woven surface. Bordeaux #633343 with restrained brown/antique-gold motifs (#86674f, #805b49). Square physical tile of 1×1 existing scene units: repeat 12.9×16.7 across the unchanged floor. This is not a metre calibration.

Mipmaps enabled; trilinear minification, linear magnification, anisotropy up to 8 capped to GPU capability. Existing roughness=1 and bump=0.003 retained.

Floor's existing static indirect-light map gets a broad warm foreground term centred at z=2.4. Contact occlusion and rear-wall lighting are retained. A 64px warm bounce map is applied only to the two existing apron/support materials through UV1. It is stronger at the front and fades toward the back. Geometry, surface UV0, base colours, rail, legs and all real-time lights remain unchanged. The high apron light-map multiplier compensates for the existing very dark multiplied wood albedo; it is an artistic indirect-light approximation, not a physically calibrated bake.

Camera, room walls, chairs, dealer, felt/cards/chips, animations, captions, lessons and storage are unchanged.

## Validation

Same settled River scene at 1440×900, 844×390, 667×375; local before/after images in docs/screenshots/carpet-refinement. First trial had oversized bright motifs; final tile size reduced from 1.4 to 1.0 scene units and motif colours subdued. Final screenshots show the carpet pattern across the foreground, with the apron still deliberately darker than the felt. No page errors in the captures.

72 unit tests and Pages production build passed. Existing large-chunk warning remains. All 14 existing browser tests passed, including learning, persistence, 52 cards, WebGL fallback and texture-load failure handling.

River scene counters: 125 draw calls and 77,258 triangles unchanged; GPU textures 29→30. Carpet 512→1024 plus a 64px apron map adds approximately 4.02 MiB including mipmaps. No new live light/shadow passes or network images. 3D JS gzip increases approximately 0.8KB.

## Limits

Viewport emulation is not physical mobile-device performance testing. Static bounce is not path-traced global illumination. Fine fibre detail is intentionally filtered at distance to avoid moire; the larger damask pattern remains legible. Display brightness still affects dark wood visibility. Dealer model remains unchanged.
