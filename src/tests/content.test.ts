import { it, expect } from "vitest";
import { lessons, curriculumChanges } from "../data/lessons";
import { sources } from "../data/sources";
const questions = lessons.flatMap((l) =>
  l.steps.flatMap((s) => (s.question ? [s.question] : [])),
);
it("10教材・各3問・一意の教材、ステップ、問題ID", () => {
  expect(lessons).toHaveLength(10);
  expect(new Set(lessons.map((l) => l.id)).size).toBe(10);
  expect(questions).toHaveLength(30);
  expect(new Set(questions.map((q) => q.id)).size).toBe(30);
  const ids = lessons.flatMap((l) => l.steps.map((s) => s.id));
  expect(new Set(ids).size).toBe(ids.length);
  lessons.forEach((l) =>
    expect(l.steps.filter((s) => s.question).length).toBeGreaterThanOrEqual(3),
  );
});
it("出典・前提・更新履歴の整合性", () => {
  const ids = sources.map((s) => s.id);
  lessons.forEach((l) => {
    l.prerequisites.forEach((p) =>
      expect(lessons.some((x) => x.id === p)).toBe(true),
    );
    [
      ...l.sourceIds,
      ...l.steps.flatMap((s) => s.sourceIds),
      ...l.steps.flatMap((s) => s.question?.sourceIds ?? []),
    ].forEach((id) => expect(ids).toContain(id));
    expect(
      curriculumChanges.some(
        (c) => c.lessonId === l.id && c.newVersion === l.version,
      ),
    ).toBe(true);
  });
});
it("公開教材と参照出典に未検証を含めない", () => {
  lessons
    .filter((l) => l.publicationStatus === "published")
    .forEach((l) => {
      expect(l.verificationStatus).not.toBe("UNVERIFIED");
      l.sourceIds.forEach((id) =>
        expect(sources.find((s) => s.id === id)?.verificationStatus).not.toBe(
          "UNVERIFIED",
        ),
      );
    });
});
it("バージョン・正解の整合性", () => {
  [...lessons, ...questions].forEach((x) =>
    expect(x.version).toMatch(/^\d+\.\d+\.\d+$/),
  );
  questions.forEach((q) => {
    if (q.kind === "number")
      expect(Number.isFinite(Number(q.answer))).toBe(true);
    else expect(q.options).toContain(q.answer);
    expect(q.explanation.length).toBeGreaterThan(10);
  });
});
it("テーブルで同じカードが重複しない", () => {
  lessons
    .flatMap((l) => l.steps)
    .forEach((s) => {
      if (s.tableState) {
        const c = [
          ...s.tableState.hole,
          ...s.tableState.board,
          ...(s.tableState.opponent ?? []),
        ];
        expect(new Set(c.map((c) => c.rank + c.suit)).size).toBe(c.length);
      }
    });
});
