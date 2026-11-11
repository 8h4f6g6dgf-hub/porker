import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Experience from "../immersive/Experience";
import { LearningProvider } from "../persistence/context";
import { emptyData, localRepository } from "../persistence/storage";
function start() {
  render(
    <MemoryRouter>
      <LearningProvider>
        <Experience />
      </LearningProvider>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: "演出をスキップ" }));
  fireEvent.click(screen.getByRole("button", { name: /01 \/ LEARN/ }));
  act(() => vi.advanceTimersByTime(2200));
  fireEvent.click(screen.getByRole("button", { name: "カードを確認する →" }));
}
it("軽量表示で両手札をめくり、導入クイズを保存。既存進捗を上書きしない", () => {
  vi.useFakeTimers();
  try {
    const original = {
      step: 4,
      completed: true,
      updatedAt: "2026-11-01T00:00:00Z",
      version: "1.0.0",
    };
    localRepository.save({
      ...emptyData(),
      progress: { "lesson-01": original },
    });
    start();
    expect(
      screen.getByRole("button", { name: "ハンドについて聞く →" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "手札1をめくる" }));
    fireEvent.click(screen.getByRole("button", { name: "手札2をめくる" }));
    fireEvent.click(
      screen.getByRole("button", { name: "ハンドについて聞く →" }),
    );
    for (let i = 0; i < 3; i++) {
      act(() => vi.advanceTimersByTime(1500));
      fireEvent.click(screen.getByRole("button", { name: "次へ進む →" }));
    }
    act(() => vi.advanceTimersByTime(1500));
    fireEvent.click(screen.getByRole("button", { name: "最初のクイズへ →" }));
    const answer = screen.getByRole("button", { name: "3枚" });
    fireEvent.click(answer);
    fireEvent.click(answer);
    expect(screen.getByRole("status")).toHaveTextContent("正解は2枚");
    fireEvent.click(screen.getByRole("button", { name: "学びを続ける →" }));
    fireEvent.click(screen.getByRole("link", { name: "レッスン01を続ける →" }));
    const saved = localRepository.load();
    expect(saved.answers).toHaveLength(1);
    expect(saved.answers[0]).toMatchObject({
      questionId: "intro-v2-hole-cards",
      questionVersion: "2.0.0",
      correct: false,
    });
    expect(saved.progress["lesson-01"]).toEqual(original);
  } finally {
    vi.useRealTimers();
  }
});
it("初回案内の既読フラグと音量設定を別領域に保持する", () => {
  render(
    <MemoryRouter>
      <LearningProvider>
        <Experience />
      </LearningProvider>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: "演出をスキップ" }));
  expect(localStorage.getItem("poker-academy.intro-seen.v2")).toBe("yes");
  fireEvent.click(screen.getByRole("button", { name: "音声と表示の設定" }));
  const sliders = screen.getAllByRole("slider");
  fireEvent.change(sliders[0], { target: { value: "0" } });
  expect(
    JSON.parse(localStorage.getItem("poker-academy.audio.v2")!),
  ).toMatchObject({ voice: false, effectsVolume: 0 });
});
