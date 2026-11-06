import { test, expect } from "@playwright/test";
async function settle(page: import("@playwright/test").Page) {
  await page.mouse.move(0, 0);
  await expect
    .poll(() =>
      page
        .locator(".playing-card")
        .evaluateAll((els) =>
          els.every(
            (el) => !getComputedStyle(el).transform.includes("matrix3d"),
          ),
        ),
    )
    .toBe(true);
}
const sizes = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 844, height: 390 },
  { width: 667, height: 375 },
];
for (const size of sizes)
  test(`横画面 ${size.width}×${size.height}: 受講・操作・保存`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/lobby");
    await expect(
      page.getByRole("heading", { name: /学びを、.*あなたの一手に。/ }),
    ).toBeVisible();
    await settle(page);
    await page.screenshot({
      path: `test-results/lobby-${size.width}.png`,
      fullPage: true,
    });
    await page.getByRole("link", { name: "はじめてのレッスンへ" }).click();
    await page.getByRole("button", { name: "次へ進む →" }).click();
    for (const name of ["A♥", "K♥", "Q♥", "J♥", "10♥"])
      await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator(".table-controls")).toContainText(
      "ロイヤルフラッシュ",
    );
    await settle(page);
    await page.screenshot({
      path: `test-results/lesson-${size.width}.png`,
      fullPage: true,
    });
    await expect.poll(() => page.evaluate(() => {
      const board = [...document.querySelectorAll('.community .playing-card')].map(el => el.getBoundingClientRect().bottom);
      const hole = [...document.querySelectorAll('.hole-cards .playing-card')].map(el => el.getBoundingClientRect().top);
      return Math.min(...hole) >= Math.max(...board);
    })).toBe(true);

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const cardBoxes = await page
      .locator(".community .playing-card")
      .evaluateAll((els) =>
        els.map((e) => {
          const r = e.getBoundingClientRect();
          return { left: r.left, right: r.right };
        }),
      );
    for (let i = 1; i < cardBoxes.length; i++)
      expect(cardBoxes[i].left).toBeGreaterThanOrEqual(
        cardBoxes[i - 1].right - 1,
      );
    await page.getByRole("button", { name: "次へ進む →" }).click();
    for (const a of ["2枚", "5枚", "勝てる"]) {
      await page.getByRole("button", { name: new RegExp(a + "$") }).click();
      await page.getByRole("button", { name: "回答を確認する →" }).click();
      await expect(page.getByText("✓ 正解です")).toBeVisible();
      await page
        .getByRole("button", {
          name: a === "勝てる" ? "レッスンを修了 ✓" : "次へ進む →",
        })
        .click();
    }
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "また一歩、テーブルに近づいた。" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "実戦のテーブルを見てみる" })
      .click();
    await page.getByRole("button", { name: "演出をスキップ →" }).click();
    await expect(page.getByText("見学専用 · Coming Soon")).toBeVisible();
    await settle(page);
    await page.screenshot({
      path: `test-results/casino-${size.width}.png`,
      fullPage: true,
    });
    for (const route of ["/academy", "/room", "/settings"]) {
      await page.goto(route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    expect(errors).toEqual([]);
  });
test("縦画面は回転案内", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/lobby");
  await expect(page.getByText("テーブルを、横向きに。")).toBeVisible();
});
test("すべての教材の操作と30問を完了できる", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/academy");
  for (let n = 1; n <= 10; n++) {
    await page.goto(`/lesson/lesson-${String(n).padStart(2, "0")}`);
    await page.getByRole("button", { name: "次へ進む →" }).click();
    if (n === 4 || n === 9) {
      await page.getByRole("button", { name: "次のラウンド →" }).click();
      await expect(page.locator(".table-controls")).toContainText("フロップ");
    }
    if (n === 6) {
      await page
        .getByRole("button", { name: "ボタンを時計回りに動かす ↻" })
        .click();
      await expect(page.locator(".seat-1")).toContainText("BTN");
    }
    if ([5, 7, 10].includes(n)) {
      await page.getByRole("button", { name: "25 チップを加える" }).click();
      await expect(page.locator(".table-controls")).toContainText("追加 25");
    }
    await page.getByRole("button", { name: "次へ進む →" }).click();
    for (let q = 0; q < 3; q++) {
      const input = page.getByRole("spinbutton");
      if (await input.count()) await input.fill("25");
      else await page.locator(".options button").first().click();
      await page.getByRole("button", { name: "回答を確認する →" }).click();
      await expect(page.locator(".answer-result")).toBeVisible();
      await page
        .getByRole("button", {
          name: q === 2 ? "レッスンを修了 ✓" : "次へ進む →",
        })
        .click();
    }
  }
  await page.goto("/room");
  await expect(page.locator(".stat-grid")).toContainText("30");
  await expect(page.locator(".stat-grid")).toContainText("100");
  await settle(page);
  await page.screenshot({ path: "test-results/room.png", fullPage: true });
});
