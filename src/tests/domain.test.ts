import { describe, it, expect } from "vitest";
import {
  cards,
  evaluate,
  compareScores,
  deck,
  potOdds,
  drawProbability,
  callAmount,
  minimumRaiseTo,
  potTotal,
  grade,
} from "../domain/poker";
describe("役判定", () => {
  const examples = [
    ["As Kd Qc Jh 9s", 0],
    ["As Ad Qc Jh 9s", 1],
    ["As Ad Qc Qh 9s", 2],
    ["As Ad Ac Jh 9s", 3],
    ["As Kd Qc Jh Ts", 4],
    ["As Js 9s 6s 2s", 5],
    ["As Ad Ac Jh Js", 6],
    ["As Ad Ac Ah 9s", 7],
    ["9s Ts Js Qs Ks", 8],
  ] as const;
  it.each(examples)("%s の役分類", (s, c) =>
    expect(evaluate(cards(s)).score[0]).toBe(c),
  );
  it("ロイヤルはストレートフラッシュ最高位", () =>
    expect(evaluate(cards("As Ks Qs Js Ts"))).toMatchObject({
      name: "ロイヤルフラッシュ",
      score: [8, 14],
    }));
  it("A2345は5ハイ", () =>
    expect(evaluate(cards("As 2d 3c 4h 5s")).score).toEqual([4, 5]));
  it("TJQKAはAハイ", () =>
    expect(evaluate(cards("As Kd Qc Jh Ts")).score).toEqual([4, 14]));
  it("QKA23はストレートではない", () =>
    expect(evaluate(cards("Qs Kd Ac 2h 3s")).score[0]).toBe(0));
  it("キッカーを比較する", () =>
    expect(
      compareScores(
        evaluate(cards("As Ad Kc 9h 4s")).score,
        evaluate(cards("Ah Ac Qd 9s 4c")).score,
      ),
    ).toBe(1));
  it("同じ役の構成ランクを先に比べる", () =>
    expect(
      compareScores(
        evaluate(cards("Ks Kd Kc 2h 2s")).score,
        evaluate(cards("Qh Qc Qd As Ac")).score,
      ),
    ).toBe(1));
  it("同じ最強5枚はスートによらず引き分け", () =>
    expect(
      compareScores(
        evaluate(cards("As Kd Qc Jh 9s")).score,
        evaluate(cards("Ah Kc Qd Js 9c")).score,
      ),
    ).toBe(0));
  it("7枚の21候補から最強の5枚を選ぶ", () =>
    expect(evaluate(cards("Ah Kh Qh Jh Th 2c 7d")).score).toEqual([8, 14]));
  it("2つのスリーカードからフルハウス", () =>
    expect(evaluate(cards("Ah Ac Ad Kh Kc Kd 2s")).score).toEqual([6, 14, 13]));
  it("ボードが最強なら双方同じ", () =>
    expect(
      compareScores(
        evaluate(cards("As Ks Qs Js Ts 2c 3d")).score,
        evaluate(cards("As Ks Qs Js Ts Ah Ad")).score,
      ),
    ).toBe(0));
  it("52枚に重複がない", () =>
    expect(new Set(deck().map((c) => c.rank + c.suit)).size).toBe(52));
  it("不正枚数・重複・不正ランクを拒否", () => {
    expect(() => evaluate(cards("As As Qc Jh 9s"))).toThrow();
    expect(() => evaluate(cards("As Kd"))).toThrow();
    expect(() =>
      evaluate([{ rank: 15, suit: "s" }, ...cards("Kd Qc Jh 9s")]),
    ).toThrow();
  });
});
describe("検証可能な数学", () => {
  it("必要勝率25%と1/3", () => {
    expect(potOdds(150, 50)).toBe(0.25);
    expect(potOdds(200, 100)).toBeCloseTo(1 / 3);
  });
  it("9アウツの次の1枚", () =>
    expect(drawProbability(9, 47, 1)).toBeCloseTo(9 / 47, 12));
  it("リバーまで2枚は余事象と一致", () =>
    expect(drawProbability(9, 47, 2)).toBeCloseTo(
      1 - (38 * 37) / (47 * 46),
      12,
    ));
  it("2枚の全組合せを列挙して照合", () => {
    let hit = 0,
      total = 0;
    for (let a = 0; a < 47; a++)
      for (let b = a + 1; b < 47; b++) {
        total++;
        if (a < 9 || b < 9) hit++;
      }
    expect(drawProbability(9, 47, 2)).toBeCloseTo(hit / total, 12);
  });
  it("確率の端点", () => {
    expect(drawProbability(0, 47, 2)).toBe(0);
    expect(drawProbability(47, 47, 2)).toBe(1);
    expect(drawProbability(9, 47, 0)).toBe(0);
  });
  it("Call・最小Raise・ポット収支", () => {
    expect(callAmount(100, 40)).toBe(60);
    expect(minimumRaiseTo(300, 200)).toBe(500);
    expect(potTotal(150, [50, 50])).toBe(250);
  });
  it("初手169分類・1326組合せ", () => {
    expect(13 + 2 * ((13 * 12) / 2)).toBe(169);
    expect((deck().length * (deck().length - 1)) / 2).toBe(1326);
  });
  it("期待値+10", () => expect(0.3 * 150 - 0.7 * 50).toBe(10));
  it("不正な計算入力を拒否", () => {
    expect(() => potOdds(-1, 10)).toThrow();
    expect(() => potOdds(0, 0)).toThrow();
    expect(() => drawProbability(48, 47, 1)).toThrow();
    expect(() => drawProbability(9, 47, 48)).toThrow();
    expect(() => potTotal(100, [-20])).toThrow();
  });
  it("空白やNaNは数値正解にならない", () => {
    expect(grade("", "0", 0.1)).toBe(false);
    expect(grade("NaN", "25", 0.1)).toBe(false);
    expect(grade("25.01", "25", 0.1)).toBe(true);
  });
});
