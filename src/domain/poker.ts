import type { Card, Suit } from "./types";
export const suits: Suit[] = ["s", "h", "d", "c"];
export const symbols: Record<Suit, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };
export const rankLabel = (rank: number) =>
  ({ 11: "J", 12: "Q", 13: "K", 14: "A" })[rank] ?? String(rank);
export function cards(value: string): Card[] {
  return value
    .split(" ")
    .filter(Boolean)
    .map((s) => {
      const rank = "23456789TJQKA".indexOf(s[0]) + 2;
      const suit = s[1] as Suit;
      if (rank < 2 || !suits.includes(suit) || s.length !== 2)
        throw new Error("Invalid card");
      return { rank, suit };
    });
}
export const deck = (): Card[] =>
  suits.flatMap((suit) =>
    Array.from({ length: 13 }, (_, i) => ({ rank: i + 2, suit })),
  );
export const handNames = [
  "ハイカード",
  "ワンペア",
  "ツーペア",
  "スリーカード",
  "ストレート",
  "フラッシュ",
  "フルハウス",
  "フォーカード",
  "ストレートフラッシュ",
];
export interface HandValue {
  score: number[];
  cards: Card[];
  name: string;
}
export function compareScores(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d) return Math.sign(d);
  }
  return 0;
}
function five(hand: Card[]): HandValue {
  const ranks = hand.map((c) => c.rank).sort((a, b) => b - a),
    unique = [...new Set(ranks)];
  const flush = hand.every((c) => c.suit === hand[0].suit);
  const straight =
    unique.length === 5
      ? unique[0] - unique[4] === 4
        ? unique[0]
        : unique.join(",") === "14,5,4,3,2"
          ? 5
          : 0
      : 0;
  const groups = unique
    .map((r) => ({ r, n: ranks.filter((x) => x === r).length }))
    .sort((a, b) => b.n - a.n || b.r - a.r);
  let score: number[];
  if (flush && straight) score = [8, straight];
  else if (groups[0].n === 4) score = [7, ...groups.map((g) => g.r)];
  else if (groups[0].n === 3 && groups[1].n === 2)
    score = [6, ...groups.map((g) => g.r)];
  else if (flush) score = [5, ...ranks];
  else if (straight) score = [4, straight];
  else if (groups[0].n === 3) score = [3, ...groups.map((g) => g.r)];
  else if (groups[0].n === 2 && groups[1].n === 2)
    score = [2, ...groups.map((g) => g.r)];
  else if (groups[0].n === 2) score = [1, ...groups.map((g) => g.r)];
  else score = [0, ...ranks];
  return {
    score,
    cards: hand,
    name:
      score[0] === 8 && score[1] === 14
        ? "ロイヤルフラッシュ"
        : handNames[score[0]],
  };
}
export function evaluate(hand: Card[]): HandValue {
  if (
    hand.length < 5 ||
    hand.length > 7 ||
    new Set(hand.map((c) => c.rank + c.suit)).size !== hand.length ||
    hand.some(
      (c) =>
        !Number.isInteger(c.rank) ||
        c.rank < 2 ||
        c.rank > 14 ||
        !suits.includes(c.suit),
    )
  )
    throw new Error("5〜7枚の重複しないカードが必要です");
  let best: HandValue | undefined;
  for (let a = 0; a < hand.length - 4; a++)
    for (let b = a + 1; b < hand.length - 3; b++)
      for (let c = b + 1; c < hand.length - 2; c++)
        for (let d = c + 1; d < hand.length - 1; d++)
          for (let e = d + 1; e < hand.length; e++) {
            const v = five([hand[a], hand[b], hand[c], hand[d], hand[e]]);
            if (!best || compareScores(v.score, best.score) > 0) best = v;
          }
  return best!;
}
function nonnegative(...n: number[]) {
  if (n.some((x) => !Number.isFinite(x) || x < 0))
    throw new Error("非負の有限値が必要です");
}
export function potOdds(potIncludingBet: number, call: number) {
  nonnegative(potIncludingBet, call);
  if (potIncludingBet + call === 0) throw new Error("ポットが空です");
  return call / (potIncludingBet + call);
}
export function drawProbability(outs: number, unseen: number, draws: number) {
  if (
    ![outs, unseen, draws].every(Number.isInteger) ||
    outs < 0 ||
    unseen <= 0 ||
    outs > unseen ||
    draws < 0 ||
    draws > unseen
  )
    throw new Error("不正な確率条件");
  let miss = 1;
  for (let i = 0; i < draws; i++)
    miss *= Math.max(0, unseen - outs - i) / (unseen - i);
  return 1 - miss;
}
export function callAmount(highest: number, committed: number) {
  nonnegative(highest, committed);
  return Math.max(0, highest - committed);
}
export function minimumRaiseTo(highest: number, lastFullRaise: number) {
  nonnegative(highest, lastFullRaise);
  return highest + lastFullRaise;
}
export function potTotal(previous: number, contributions: number[]) {
  nonnegative(previous, ...contributions);
  return previous + contributions.reduce((a, b) => a + b, 0);
}
export function grade(answer: string, expected: string, tolerance = 0) {
  if (tolerance > 0)
    return (
      answer.trim() !== "" &&
      Number.isFinite(Number(answer)) &&
      Math.abs(Number(answer) - Number(expected)) <= tolerance
    );
  return answer.trim() === expected;
}
