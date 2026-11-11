import { useEffect, useState } from "react";

// Explicit editorial boundaries preserve every character of the lesson script.
const breaks: Record<string, string[]> = {
  "ここでは、実際にカードに触れながらポーカーを学んでいきます。": ["ここでは、実際にカードに触れながら", "ポーカーを学んでいきます。"],
  "テキサスホールデムでは、最初に各プレイヤーへ2枚のカードが配られます。": ["テキサスホールデムでは、", "最初に各プレイヤーへ2枚のカードが配られます。"],
  "このカードと、テーブルに公開される5枚のカードを組み合わせて、最も強い5枚の役を作ります。": ["このカードと、", "テーブルに公開される5枚のカードを組み合わせて、", "最も強い5枚の役を作ります。"],
  "自分のカードは、0枚、1枚、2枚のどの使い方でも構いません。": ["自分のカードは、", "0枚、1枚、2枚のどの使い方でも構いません。"],
  "テーブルの中央には、全員が使えるカードが公開されます。": ["テーブルの中央には、", "全員が使えるカードが公開されます。"],
  "実際のゲームでは、各段階の間にチップを賭けるベットを行います。": ["実際のゲームでは、各段階の間に", "チップを賭けるベットを行います。"],
  "テキサスホールデムで、最初に配られる自分のカードは何枚でしょう？": ["テキサスホールデムで、", "最初に配られる自分のカードは何枚でしょう？"],
  "手元の2枚があなただけのカード、中央の5枚は全員の共通カードです。": ["手元の2枚があなただけのカード、", "中央の5枚は全員の共通カードです。"],
  "CPU・オンライン対戦は Coming Soon。": ["CPU・オンライン対戦は Coming Soon。"],
};
export function captionPages(lines: readonly string[]): string[][] {
  return lines.flatMap(line => (line.match(/[^。！？]+[。！？]?/gu) ?? [line]).flatMap(sentence => {
    const rows = breaks[sentence] ?? [sentence];
    const pages: string[][] = [];
    for (let i = 0; i < rows.length; i += 2) pages.push(rows.slice(i, i + 2));
    return pages;
  }));
}
export function Captions({ lines, busy, reduced }: { lines: readonly string[]; busy: boolean; reduced: boolean }) {
  const pages = captionPages(lines);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (busy || paused || index >= pages.length - 1) return;
    const timer = setTimeout(() => setIndex(i => i + 1), Math.max(4200, pages[index].join("").length * 150));
    return () => clearTimeout(timer);
  }, [busy, paused, index, pages]);
  return <>
    <p key={index} className={`caption-page ${reduced ? "caption-still" : ""}`} aria-live="polite">
      {pages[index]?.map((row, i) => <span className="caption-row" key={i}>{row}</span>)}
    </p>
    {pages.length > 1 && <nav className="caption-navigation" aria-label="字幕のページ">
      <button aria-label="前の字幕" disabled={busy || index === 0} onClick={() => { setPaused(true); setIndex(i => i - 1); }}>‹</button>
      <span>{index + 1} / {pages.length}</span>
      <button aria-label={paused ? "字幕の自動送りを再開" : "字幕の自動送りを停止"} onClick={() => setPaused(v => !v)}>{paused ? "再開" : "一時停止"}</button>
      <button aria-label="次の字幕" disabled={busy || index === pages.length - 1} onClick={() => { setPaused(true); setIndex(i => i + 1); }}>›</button>
    </nav>}
  </>;
}
