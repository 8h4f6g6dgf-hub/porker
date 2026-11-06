import { describe, expect, it } from "vitest";
import {
  initialIntroState,
  introQuestion,
  introReducer,
  resultLines,
  scenario,
  sceneFor,
  type IntroState,
} from "../immersive/scenario";
import { sources } from "../data/sources";

const next = (state: IntroState) => introReducer(state, { type: "NEXT" });
function startLesson() {
  return introReducer(
    introReducer(initialIntroState(), { type: "SKIP_INTRO" }),
    { type: "START_LESSON" },
  );
}

describe("体験型レッスンのシナリオ", () => {
  it("8章、12の一意な演出ステップと有効な根拠を持つ", () => {
    expect(new Set(scenario.map((scene) => scene.scene)).size).toBe(8);
    expect(new Set(scenario.map((scene) => scene.id)).size).toBe(
      scenario.length,
    );
    scenario.forEach((scene) => {
      expect(scene.title.length).toBeGreaterThan(0);
      if (scene.durationMs !== null)
        expect(scene.durationMs).toBeGreaterThanOrEqual(3000);
      scene.sourceIds.forEach((id) =>
        expect(sources.some((source) => source.id === id)).toBe(true),
      );
    });
  });
  it("共通カードの公開と説明はフロップ3、ターン4、リバー5で対応する", () => {
    expect(
      ["flop", "turn", "river"].map(
        (phase) => sceneFor(phase as "flop" | "turn" | "river").communityCount,
      ),
    ).toEqual([3, 4, 5]);
    expect(sceneFor("flop").lines.join("")).toContain("フロップ");
    expect(sceneFor("turn").lines.join("")).toContain("ターン");
    expect(sceneFor("river").lines.join("")).toContain("リバー");
    expect(sceneFor("hand").lines.join("")).toContain("0枚、1枚、2枚");
  });
  it("入口から着席、メニューへ進み、学習の明示選択まで配らない", () => {
    const seated = next(initialIntroState());
    expect(seated.phase).toBe("seat");
    const menu = next(seated);
    expect(menu.phase).toBe("choose");
    expect(next(menu)).toBe(menu);
    expect(introReducer(menu, { type: "START_LESSON" }).phase).toBe("deal");
  });
  it("入口・着席はスキップでき、学習中にはスキップが干渉しない", () => {
    expect(
      introReducer(initialIntroState(), { type: "SKIP_INTRO" }).phase,
    ).toBe("choose");
    expect(
      introReducer(next(initialIntroState()), { type: "SKIP_INTRO" }).phase,
    ).toBe("choose");
    const deal = startLesson();
    expect(introReducer(deal, { type: "SKIP_INTRO" })).toBe(deal);
  });
  it("2枚とも開くまでは先へ進めず、連打や不正インデックスは無視する", () => {
    const deal = startLesson();
    expect(introReducer(deal, { type: "REVEAL", index: 0 })).toBe(deal);
    const hidden = next(deal);
    expect(hidden.phase).toBe("reveal");
    expect(next(hidden)).toBe(hidden);
    const one = introReducer(hidden, { type: "REVEAL", index: 0 });
    expect(one.revealed).toEqual([true, false]);
    expect(next(one)).toBe(one);
    expect(introReducer(one, { type: "REVEAL", index: 0 })).toBe(one);
    expect(introReducer(one, { type: "REVEAL", index: 3 })).toBe(one);
    const both = introReducer(one, { type: "REVEAL", index: 1 });
    expect(next(both).phase).toBe("hand");
    expect(hidden.revealed).toEqual([false, false]);
  });
  it("未回答のクイズはスキップできず、不正な選択肢を拒否する", () => {
    const quiz: IntroState = {
      phase: "quiz",
      revealed: [true, true],
      answer: null,
    };
    expect(next(quiz)).toBe(quiz);
    expect(introReducer(quiz, { type: "ANSWER", answer: "7枚" })).toBe(quiz);
    expect(
      introReducer(startLesson(), { type: "ANSWER", answer: "2枚" }).answer,
    ).toBeNull();
  });
  it.each(introQuestion.options)(
    "回答%sを一度だけ確定し、説明後に継続へ接続する",
    (answer) => {
      const quiz: IntroState = {
        phase: "quiz",
        revealed: [true, true],
        answer: null,
      };
      const result = introReducer(quiz, { type: "ANSWER", answer });
      expect(result).toEqual({ ...quiz, phase: "result", answer });
      expect(introReducer(result, { type: "ANSWER", answer: "2枚" })).toBe(
        result,
      );
      expect(resultLines(answer).join("")).toContain("2枚");
      expect(next(result).phase).toBe("continue");
      expect(next(next(result))).toEqual(next(result));
    },
  );
  it("戻っても確定済みの回答を書き換えず、リプレイのみ状態を初期化する", () => {
    const result: IntroState = {
      phase: "result",
      revealed: [true, true],
      answer: "3枚",
    };
    const back = introReducer(result, { type: "BACK" });
    expect(back.phase).toBe("river");
    expect(back.answer).toBe("3枚");
    expect(next(back)).toEqual(result);
    expect(introReducer(result, { type: "RESTART" })).toEqual(
      initialIntroState(),
    );
    expect(introReducer(initialIntroState(), { type: "BACK" })).toEqual(
      initialIntroState(),
    );
  });
  it("体験クイズは既存の問題と異なるIDを使用する", () => {
    expect(introQuestion.id).toBe("intro-v2-hole-cards");
    expect(introQuestion.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(introQuestion.options).toContain(introQuestion.answer);
  });
});
