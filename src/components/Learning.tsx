import type { ReactNode } from "react";
import { sources } from "../data/sources";
export function ActionButtons({ children }: { children: ReactNode }) {
  return <div className="action-buttons">{children}</div>;
}
export function ExplanationPanel({
  children,
  open,
  toggle,
}: {
  children: ReactNode;
  open: boolean;
  toggle: () => void;
}) {
  return (
    <aside className={`explanation ${open ? "" : "collapsed"}`}>
      <button className="panel-toggle" onClick={toggle}>
        {open ? "解説を閉じる −" : "解説を開く ＋"}
      </button>
      {open && children}
    </aside>
  );
}
export function LessonProgress({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  return (
    <div className="lesson-progress">
      <span>
        学習ステップ{" "}
        <b>
          {Math.min(step + 1, total)} / {total}
        </b>
      </span>
      <progress max={total} value={step} />
    </div>
  );
}
export function SourceReference({ ids }: { ids: string[] }) {
  return (
    <details className="sources">
      <summary>
        解説の根拠 <span>↗</span>
      </summary>
      {ids.map((id) => {
        const s = sources.find((s) => s.id === id);
        if (!s) return null;
        return (
          <article key={id}>
            <div className="tags">
              <span>{s.category}</span>
              <span>{s.verificationStatus}</span>
            </div>
            <strong>{s.title}</strong>
            {s.url && (
              <a href={s.url} target="_blank" rel="noreferrer">
                参考資料を開く ↗
              </a>
            )}
            <p>参照箇所：{s.section}</p>
            <p>確認日：{s.accessedAt ?? "2026-11-05（自動テスト）"}</p>
            <p>検証方法：{s.verificationNotes}</p>
            <p>注意事項：{s.caveat}</p>
            <small>根拠ID：{id}</small>
          </article>
        );
      })}
    </details>
  );
}
