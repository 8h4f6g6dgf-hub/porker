import { describe, expect, it } from 'vitest';
import { boardCardX, CARD_LAYOUT } from '../immersive/cardLayout';
describe('card table layout', () => {
  it.each([3, 4, 5])('%i board cards stay centered, separated and inside the table', count => {
    const xs = Array.from({length: count}, (_, i) => boardCardX(i, count));
    expect(xs.reduce((a, b) => a + b, 0)).toBeCloseTo(0);
    for(let i=1;i<count;i++) expect(xs[i]-xs[i-1]).toBeCloseTo(0.66);
    expect(Math.max(...xs.map(Math.abs)) + 0.25).toBeLessThan(1.6);
  });
  it('keeps the hands apart and clears the board vertically', () => {
    expect(CARD_LAYOUT.handHalfPitch * 2 - 0.5).toBeCloseTo(0.244);
    expect(CARD_LAYOUT.handZ - CARD_LAYOUT.boardZ - 0.7).toBeGreaterThan(0.4);
  });
});
