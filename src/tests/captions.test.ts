import { expect, it } from "vitest";
import { captionPages } from "../immersive/Captions";
import { scenario, resultLines } from "../immersive/scenario";
it("字幕分割で説明を一文字も失わず、各ページを最大2行にする", () => {
  for (const lines of [...scenario.map(s => s.lines), resultLines("2枚"), resultLines("3枚")]) {
    const pages = captionPages(lines);
    expect(pages.flat().join("")).toBe(lines.join(""));
    expect(pages.every(p => p.length <= 2)).toBe(true);
  }
});
