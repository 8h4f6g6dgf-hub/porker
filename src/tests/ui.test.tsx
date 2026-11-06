import { it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { LearningProvider } from "../persistence/context";
import { localRepository } from "../persistence/storage";
function renderApp(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LearningProvider>
        <App />
      </LearningProvider>
    </MemoryRouter>,
  );
}
it("ロビーから開始、操作、回答、根拠、修了、保存復元、CASINOへ移動", async () => {
  const view = renderApp();
  fireEvent.click(screen.getByRole("link", { name: /はじめてのレッスンへ/ }));
  expect(screen.getByText("まずは、仕組みを知ろう。")).toBeInTheDocument();
  fireEvent.click(screen.getByText("解説の根拠"));
  expect(
    screen.getByText("PokerStars — How to Play Texas Hold’em"),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "次へ進む →" }));
  for (const label of ["A♥", "K♥", "Q♥", "J♥", "10♥"])
    fireEvent.click(screen.getByRole("button", { name: label }));
  expect(
    screen.getByText(/ロイヤルフラッシュ/, { selector: ".table-controls b" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "次へ進む →" }));
  for (const correct of ["2枚", "5枚", "勝てる"]) {
    const next = screen.getByRole("button", {
      name: correct === "勝てる" ? "レッスンを修了 ✓" : "次へ進む →",
    });
    expect(next).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(correct + "$") }),
    );
    fireEvent.click(screen.getByRole("button", { name: "回答を確認する →" }));
    expect(screen.getByText("✓ 正解です")).toBeInTheDocument();
    fireEvent.click(next);
  }
  await waitFor(() =>
    expect(localRepository.load().progress["lesson-01"].completed).toBe(true),
  );
  expect(localRepository.load().answers).toHaveLength(3);
  view.unmount();
  renderApp("/lesson/lesson-01");
  expect(
    screen.getByText("また一歩、テーブルに近づいた。"),
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "実戦のテーブルを見てみる" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "演出をスキップ →" }));
  expect(screen.getByText("Coming Soon")).toBeInTheDocument();
});
it("不正解にも解説を表示し、二重回答しない", () => {
  renderApp("/lesson/lesson-01");
  fireEvent.click(screen.getByRole("button", { name: "次へ進む →" }));
  fireEvent.click(screen.getByRole("button", { name: "次へ進む →" }));
  fireEvent.click(screen.getByRole("button", { name: /1枚$/ }));
  const submit = screen.getByRole("button", { name: "回答を確認する →" });
  fireEvent.click(submit);
  fireEvent.click(submit);
  expect(screen.getByText("もう一度、ポイントを確認")).toBeInTheDocument();
  expect(localRepository.load().answers).toHaveLength(1);
  expect(localRepository.load().answers[0].correct).toBe(false);
});
it("途中の学習ステップを復元する", () => {
  const v = renderApp("/lesson/lesson-04");
  fireEvent.click(screen.getByRole("button", { name: "次へ進む →" }));
  expect(
    screen.getByRole("button", { name: "次のラウンド →" }),
  ).toBeInTheDocument();
  v.unmount();
  renderApp("/lesson/lesson-04");
  expect(
    screen.getByRole("button", { name: "次のラウンド →" }),
  ).toBeInTheDocument();
});
it("数字入力、集計画面、設定の動き削減", () => {
  renderApp("/lesson/lesson-07");
  fireEvent.click(screen.getByRole("button", { name: "次へ進む →" }));
  fireEvent.click(screen.getByRole("button", { name: "次へ進む →" }));
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "60" } });
  fireEvent.click(screen.getByRole("button", { name: "回答を確認する →" }));
  expect(screen.getByText("✓ 正解です")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "MY ROOM" }));
  expect(screen.getAllByText("100%").length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("link", { name: "設定" }));
  fireEvent.click(screen.getByRole("checkbox"));
  expect(localRepository.load().reducedMotion).toBe(true);
});
