

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
  if (lines.join("") === "最後の1枚がリバーです。実際のゲームでは、各段階の間にチップを賭けるベットを行います。いまはカードの流れを見ています。") return [
    ["最後の1枚がリバーです。"],
    ["実際のゲームでは、各段階の間にチップを賭けるベットを行います。", "いまはカードの流れを見ています。"],
  ];
  if (lines[0] === "実戦の舞台へ、ようこそ。") return [[...lines]];
  if (lines[0] === "最初の一歩ができました。") return [[...lines]];
  return lines.flatMap(line => (line.match(/[^。！？]+[。！？]?/gu) ?? [line]).flatMap(sentence => {
    const rows = breaks[sentence] ?? [sentence];
    const pages: string[][] = [];
    for (let i = 0; i < rows.length; i += 2) pages.push(rows.slice(i, i + 2));
    return pages;
  }));
}
export function Captions({ lines, index, reduced }: { lines: readonly string[]; index: number; reduced: boolean }) {
  const pages = captionPages(lines);
  return <>
    <p key={index} className={`caption-page ${reduced ? "caption-still" : ""}`} aria-live="polite">
      {pages[index]?.map((row, i) => <span className="caption-row" key={i}>{row}</span>)}
    </p>
    {pages.length > 1 && <div className="caption-navigation" aria-label="字幕の進行">{index + 1} / {pages.length}</div>}
  </>;
}
