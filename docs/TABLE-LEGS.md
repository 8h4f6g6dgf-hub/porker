# Poker table support refinement

## Reference

Focus Gaming Solutions offers casino poker tables with wooden H-style legs:
https://www.focusgamingsolutions.com/casino-equipment/table-games/poker-tables/
TCSJOHNHUXLEY also specifies H/X-style table bases:
https://tcsjohnhuxley.com/wp-content/uploads/2023/03/Poker-Table-CIS-2025.pdf
These are construction references, not downloaded model assets. Geometry is original code.

## Scope and construction

Replace the two solid slab legs only. Fixed floor y=-1 and existing apron underside y=.55 are unchanged. The support height remains 1.55 scene units. No top/camera/rail/felt/card/chip/chair/dealer/room changes.

Twin timber trestles at x=±1.65 replace slab centres x=±1.9:
- Uprights: 0.23×1.40×0.27, tapering 15% toward the bottom, softly bevelled.
- Low transverse feet: 0.25×0.10×1.65, rounded ends, bottom exactly y=-1.
- Upper transverse bearings: 0.29×0.10×1.46, top exactly y=.55.
- High central stretcher: 3.30×0.14×0.17 at y=.40, leaving the lower central foot space open.

All members merge into one mesh. The existing table wood texture, base colour #493426 and roughness .62 are reused. Grain follows each member's length. The existing warm apron bounce map is reused through independent UV1 with front-facing and lower-surface weighting. No additional light or texture is introduced. The local light-map multiplier compensates for the very dark existing multiplied wood albedo; it is an artistic indirect-light approximation, not calibrated radiometry.

## Checks

Two geometry tests check floor/apron bounds, paired grounded feet, finite vertices and open knee space. 74 unit tests passed. PC 1440×900, landscape 844×390 and 667×375 River comparisons saved locally in docs/screenshots/table-legs/{before,after}. All 14 existing browser tests and the final Pages production build passed; the existing large-chunk warning remains.

River counters: calls 125→123, triangles 77,258→81,410; textures remain 30. No added live lights or shadow passes. Small increase in bevel geometry, offset by merging the support parts.

## Limits

The fixed seated camera naturally occludes upper supports behind the top; it is not possible to display the full leg height without moving the camera/top, which was intentionally not done. This is a visual furniture model, not a structural engineering certification. Physical-phone thermal/performance testing is not included. Dealer anatomy remains unchanged.
