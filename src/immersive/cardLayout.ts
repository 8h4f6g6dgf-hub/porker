// Table-space dimensions; card geometry remains 0.5 × 0.7.
export const CARD_LAYOUT = {
  boardPitch: 0.66,
  handHalfPitch: 0.372,
  boardZ: -0.02,
  handZ: 1.12,
  surfaceY: 0.790,
} as const;
export function boardCardX(index: number, count: number) {
  return (index - (count - 1) / 2) * CARD_LAYOUT.boardPitch;
}
