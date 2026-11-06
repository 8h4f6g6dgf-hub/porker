import { test, expect } from "@playwright/test";
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 844, height: 390 },
  { width: 667, height: 375 },
])
  test(`3D導入 ${viewport.width}: 両手札・各ストリート・採点・既存教材へ`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page
      .getByRole("button", { name: "演出をスキップ", exact: true })
      .click();
    await expect(page.locator("canvas")).toBeVisible();
    await page.getByRole("button", { name: /01 \/ LEARN/ }).click();
    await page.getByRole("button", { name: "カードを確認する →" }).click();
    await expect(
      page.getByRole("button", { name: "ハンドについて聞く →" }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "手札1をめくる" }).click();
    await page.getByRole("button", { name: "手札2をめくる" }).click();
    await page.getByRole("button", { name: "ハンドについて聞く →" }).click();
    for (let i = 0; i < 3; i++)
      await page.getByRole("button", { name: "次へ進む →" }).click();
    await expect(page.locator("main")).toHaveAttribute("data-phase", "river");
    await expect(
      page.getByRole("button", { name: "最初のクイズへ →" }),
    ).toBeEnabled();
    await page.screenshot({
      path: `test-results/immersive-${viewport.width}.png`,
    });
    await page.getByRole("button", { name: "最初のクイズへ →" }).click();
    await page.getByRole("button", { name: "2枚", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("正解");
    await page.getByRole("button", { name: "学びを続ける →" }).click();
    await page.getByRole("link", { name: "レッスン01を続ける →" }).click();
    await expect(page.getByText("まずは、仕組みを知ろう。")).toBeVisible();
    await page.reload();
    await expect(page.getByText("まずは、仕組みを知ろう。")).toBeVisible();
    expect(errors).toEqual([]);
  });
test("WebGLなし・音声なしでも導入を操作できる", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith("webgl")) return null;
      return original.apply(this, [type, ...args] as Parameters<
        typeof original
      >);
    } as typeof original;
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "演出をスキップ", exact: true })
    .click();
  await expect(page.getByText(/軽量表示 ·/)).toBeVisible();
  await page.getByRole("button", { name: /01 \/ LEARN/ }).click();
  await page.getByRole("button", { name: "カードを確認する →" }).click();
  await page.getByRole("button", { name: "手札1をめくる" }).click();
  await expect(
    page.getByRole("button", { name: "手札1をめくる" }),
  ).toBeDisabled();
});
test("reduced-motionと再訪時の短縮・CASINOで同じ3D空間", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "着席する →" }).click();
  await expect(page.getByRole("button", {name: /01 \/ LEARN/})).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('poker-academy.intro-seen.v2'))).toBe('yes');
  await page.reload();
  // Reduced motion automatically advances the entrance in 300ms; do not race its transient skip button.
  await page.getByRole('button', {name: '着席する →'}).click();
  await page.getByRole("link", { name: /02 \/ PRACTICE/ }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByText("見学専用 · Coming Soon")).toBeVisible();
});
