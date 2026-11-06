import { it, expect, vi } from "vitest";
import {
  localRepository,
  emptyData,
  decodeData,
  STORAGE_KEY,
  accuracy,
  needsReview,
} from "../persistence/storage";
import type { AnswerRecord } from "../domain/types";
const answer: AnswerRecord = {
  id: "a",
  lessonId: "lesson-01",
  lessonVersion: "1.0.0",
  questionId: "q1",
  questionVersion: "1.0.0",
  answer: "2枚",
  correct: true,
  correctAnswer: "2枚",
  topic: "基本ルール",
  answeredAt: "2026-11-05T00:00:00Z",
};
it("保存と再読み込み・版の保持", () => {
  const d = {
    ...emptyData(),
    answers: [answer],
    lastLesson: "lesson-01",
    progress: {
      "lesson-01": {
        step: 2,
        completed: false,
        updatedAt: answer.answeredAt,
        version: "1.0.0",
      },
    },
  };
  localRepository.save(d);
  expect(localRepository.load()).toEqual(d);
});
it("データなしを0件と扱う", () => {
  expect(localRepository.load()).toEqual(emptyData());
  expect(accuracy([])).toBeNull();
});
it("破損・未知スキーマを上書きしない", () => {
  localStorage.setItem(STORAGE_KEY, "broken");
  expect(() => localRepository.load()).toThrow();
  expect(localStorage.getItem(STORAGE_KEY)).toBe("broken");
  expect(() => decodeData('{"schemaVersion":2}')).toThrow();
  expect(() =>
    decodeData(JSON.stringify({ ...emptyData(), answers: [{}] })),
  ).toThrow();
});
it("保存失敗を呼び出し元へ通知", () => {
  const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("QuotaExceededError");
  });
  expect(() => localRepository.save(emptyData())).toThrow();
  spy.mockRestore();
});
it("最新回答で復習判定、全履歴で正答率", () => {
  const wrong = { ...answer, correct: false };
  expect(needsReview([wrong], "lesson-01")).toBe(true);
  expect(needsReview([wrong, answer], "lesson-01")).toBe(false);
  expect(accuracy([wrong, answer])).toBe(50);
});
