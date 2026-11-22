# Professional poker table refinement

## Reference and scope

- 916 Poker Depot casino tables: https://www.916pokerdepot.com/casino-products/gaming-tables/texas-holdem-casino-style-tables/ — 96 × 48 inch reference and padded rail construction.
- MRC Prestige product photograph: https://mrcpoker.ca/products/mrc-poker-tables-the-prestige-pedestal-legs — visually checked elongated oval, black cushion and paired supports.
- Blatt Hampton product photograph: https://blattbilliards.com/products/hampton-texas-holdem-table — visually checked straight sides, rounded ends and paired supports.

Photos are reference only, not bundled or redistributed. Geometry and material changes are original code; no new paid assets, textures or dependencies.

## Implementation

Scene units are retained, not metres. Outline changes from a 6.7 × 4.16 ellipse (1.61:1) to a 7.4 × 3.6 racetrack (2.06:1). Long straight section length is 3.8, end radius 1.8. Top, support, felt and rail use the same profile function rather than scaling a cylinder. Felt top remains y=0.7875. Felt UVs are normalised independently of physical size.

Rail width 0.30 → 0.22; thickness 0.15 → 0.096; near-black #171412, roughness 0.86, subdued seam. Wooden apron thickness 0.24 → 0.14; decorative gold ring removed. Two supporting legs move to x=±1.9, extend from the floor y=-1 to the apron underside y=0.55.

Dealer-side chairs removed. Five chairs: two side seats (±4.25,0.35), two front seats (±2.3,2.55), own seat (0,2.75). Front chairs face the straight playing edge, side chairs face inward. Own chair remains below the sightline to cards.

Camera, lighting, room, dealer, card/chip coordinates, animation and learning state are unchanged. No cup holders or trays added.

## Verification

72 unit tests passed. Full existing browser suite: 14 passed; immersive suite rerun after UV adjustment. PC 1440×900 and landscape 844×390 / 667×375 reviewed at river; tests also capture flop and turn. Screenshots stored locally under docs/screenshots/professional-table (not shipped as application assets).

Baseline/new rendering: 99/97 calls; 82,330/75,718 triangles; 12/12 textures. Headless desktop Chrome median rAF interval 16.7 ms at PC and mobile viewport sizes; this is not a physical-phone benchmark. Pages build succeeds with existing >500kB chunk warning.

Limitations: dealer anatomy remains unchanged and unfinished from the previous task. Actual mobile hardware performance not measured. Fixed desktop framing crops outer table ends; camera intentionally remains unchanged.
