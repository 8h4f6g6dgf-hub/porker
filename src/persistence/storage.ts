import type {
  LearningData,
  AnswerRecord,
  LessonProgressRecord,
} from "../domain/types";
export const STORAGE_KEY = "poker-academy.learning.v1";
export const emptyData = (): LearningData => ({
  schemaVersion: 1,
  answers: [],
  progress: {},
  reducedMotion: false,
});
export interface LearningRepository {
  load(): LearningData;
  save(data: LearningData): void;
  clear(): void;
}
const obj = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;
function isAnswer(x: unknown): x is AnswerRecord {
  return (
    obj(x) &&
    [
      "id",
      "lessonId",
      "lessonVersion",
      "questionId",
      "questionVersion",
      "answer",
      "correctAnswer",
      "topic",
      "answeredAt",
    ].every((k) => typeof x[k] === "string") &&
    typeof x.correct === "boolean"
  );
}
function isProgress(x: unknown): x is LessonProgressRecord {
  return (
    obj(x) &&
    Number.isInteger(x.step) &&
    Number(x.step) >= 0 &&
    typeof x.completed === "boolean" &&
    typeof x.version === "string" &&
    typeof x.updatedAt === "string"
  );
}
export function decodeData(raw: string): LearningData {
  const value: unknown = JSON.parse(raw);
  if (
    !obj(value) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.answers) ||
    !value.answers.every(isAnswer) ||
    !obj(value.progress) ||
    !Object.values(value.progress).every(isProgress) ||
    typeof value.reducedMotion !== "boolean" ||
    (value.lastLesson !== undefined && typeof value.lastLesson !== "string")
  )
    throw new Error(
      "保存データの形式またはバージョンに対応していません。設定からデータをバックアップできます。",
    );
  return value as unknown as LearningData;
}
export const localRepository: LearningRepository = {
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? decodeData(raw) : emptyData();
  },
  save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
export function accuracy(answers: AnswerRecord[]) {
  return answers.length
    ? Math.round(
        (answers.filter((a) => a.correct).length / answers.length) * 100,
      )
    : null;
}
export function needsReview(answers: AnswerRecord[], lessonId: string) {
  const latest = new Map<string, AnswerRecord>();
  answers
    .filter((a) => a.lessonId === lessonId)
    .forEach((a) => latest.set(a.questionId, a));
  return [...latest.values()].some((a) => !a.correct);
}
