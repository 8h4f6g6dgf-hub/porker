import { useState, useEffect, useRef } from "react";
import {
  Link,
  NavLink,
  Routes,
  Route,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { MotionConfig } from "motion/react";
import {
  publishedLessons as lessons,
  sampleTable,
  curriculumChanges,
} from "./data/lessons";
import { useLearning } from "./persistence/context";
import { accuracy, needsReview, STORAGE_KEY } from "./persistence/storage";
import { PokerTable } from "./components/Table";
import {
  ActionButtons,
  ExplanationPanel,
  LessonProgress,
  SourceReference,
} from "./components/Learning";
import { evaluate, grade } from "./domain/poker";
import type { Card, Lesson } from "./domain/types";
const num = (n: number) => String(n).padStart(2, "0");
const rate = (n: number | null) => (n === null ? "—" : `${n}%`);
function useStats() {
  const { data } = useLearning();
  return {
    completed: lessons.filter((l) => data.progress[l.id]?.completed).length,
    rate: accuracy(data.answers),
    total: data.answers.length,
  };
}
function lessonStatus(l: Lesson, data: ReturnType<typeof useLearning>["data"]) {
  return needsReview(data.answers, l.id)
    ? "復習推奨"
    : data.progress[l.id]?.completed
      ? "完了"
      : data.progress[l.id]
        ? "学習中"
        : "未開始";
}
export default function App() {
  const { data, error } = useLearning();
  const location = useLocation();
  return (
    <MotionConfig reducedMotion={data.reducedMotion ? "always" : "user"}>
      <div
        className={`app ${location.pathname === "/casino" ? "casino-mode" : ""} ${data.reducedMotion ? "reduce-motion" : ""}`}
      >
        <div className="rotate-notice">
          <span>↻</span>
          <h2>テーブルを、横向きに。</h2>
          <p>
            端末を横に回転して
            <br />
            Poker Academyをお楽しみください。
          </p>
        </div>
        <header className="header">
          <Link to="/" className="brand">
            <span className="brand-mark">♠</span>
            <span>
              POKER <b>ACADEMY</b>
              <small>THE ART OF THE NEXT MOVE</small>
            </span>
          </Link>
          <nav aria-label="施設ナビゲーション">
            <NavLink to="/" end>
              LOBBY
            </NavLink>
            <NavLink to="/academy">ACADEMY</NavLink>
            <NavLink to="/casino">CASINO</NavLink>
            <NavLink to="/room">MY ROOM</NavLink>
          </nav>
          <Link to="/settings" className="settings-link" aria-label="設定">
            ⚙
          </Link>
        </header>
        {error && (
          <div className="storage-error" role="alert">
            {error}
          </div>
        )}
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/lesson/:id" element={<LessonRoute />} />
          <Route path="/casino" element={<Casino />} />
          <Route path="/room" element={<Room />} />
          <Route path="/settings" element={<Settings />} />
          <Route
            path="*"
            element={
              <main className="page">
                <h1>ページが見つかりません</h1>
                <Link to="/">ロビーへ戻る</Link>
              </main>
            }
          />
        </Routes>
        <footer>
          <span>
            POKER ACADEMY <i>◆</i> EST. 2026
          </span>
          <span>知識を、一手の自信へ。</span>
          <span>VERSION 0.1 · 無料学習</span>
        </footer>
      </div>
    </MotionConfig>
  );
}
function Lobby() {
  const { data } = useLearning(),
    stats = useStats();
  const next =
    lessons.find(
      (l) => l.id === data.lastLesson && !data.progress[l.id]?.completed,
    ) ??
    lessons.find((l) => !data.progress[l.id]?.completed) ??
    lessons[0];
  return (
    <main className="lobby">
      <section className="hero">
        <div className="architecture" aria-hidden="true">
          <div className="arch arch-one" />
          <div className="arch arch-two" />
          <div className="arch arch-three" />
          <div className="floor" />
          <div className="pendant" />
        </div>
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> WELCOME TO YOUR TABLE
          </div>
          <h1>
            学びを、
            <br />
            あなたの<span>一手</span>に。
          </h1>
          <p>
            ルールを知る。カードに触れる。
            <br />
            ゼロから始める、ポーカーという知的な冒険。
          </p>
          <Link className="button primary" to={`/lesson/${next.id}`}>
            {data.lastLesson ? "学習を続ける" : "はじめてのレッスンへ"}{" "}
            <span>↗</span>
          </Link>
          <small>経験は不要。あなたのペースで、最初の一歩を。</small>
        </div>
        <div className="hero-table">
          <div className="room-caption">
            <span className="live-dot" /> THE ACADEMY ROOM{" "}
            <small>YOUR SEAT IS READY</small>
          </div>
          <PokerTable state={sampleTable} />
          <div className="table-note">
            <span>01 — THE BEGINNING</span>
            <p>すべては、2枚のカードから。</p>
          </div>
        </div>
      </section>
      <section className="lobby-bottom">
        <div className="journey">
          <span className="eyebrow">YOUR JOURNEY</span>
          <strong>
            {num(stats.completed)}
            <span> / 10 LESSONS</span>
          </strong>
          <progress max={10} value={stats.completed} />
          <small>
            {stats.completed === 0
              ? "まだ知らない楽しさが、ここに。"
              : `正答率 ${rate(stats.rate)} · ${stats.total}問に回答`}
          </small>
        </div>
        <Link className="destination" to="/academy">
          <span className="destination-icon">♧</span>
          <div>
            <small>01 / LEARN</small>
            <h2>ACADEMY</h2>
            <p>静かなテーブルで、基礎から学ぶ。</p>
          </div>
          <span>↗</span>
        </Link>
        <Link className="destination" to="/casino">
          <span className="destination-icon">♠</span>
          <div>
            <small>02 / EXPLORE</small>
            <h2>
              CASINO <em>PREVIEW</em>
            </h2>
            <p>学んだ先にある、実戦の舞台へ。</p>
          </div>
          <span>↗</span>
        </Link>
        <Link className="destination" to="/room">
          <span className="destination-icon">♙</span>
          <div>
            <small>03 / REFLECT</small>
            <h2>MY ROOM</h2>
            <p>積み重ねた学びを、振り返る。</p>
          </div>
          <span>↗</span>
        </Link>
      </section>
    </main>
  );
}
function Academy() {
  const { data } = useLearning();
  const stats = useStats();
  return (
    <main className="page academy-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE QUIET HOURS · ACADEMY</div>
          <h1>一手ずつ、わかる楽しさ。</h1>
          <p>10のレッスンで身につく、テキサスホールデムの基礎。</p>
        </div>
        <div className="heading-stat">
          <strong>{num(stats.completed)}</strong>
          <span>/ 10 レッスン完了</span>
        </div>
      </div>
      <div className="curriculum-label">
        <span>BEGINNER COURSE</span>
        <span>各約6分 · カード操作と理解度確認3問</span>
      </div>
      <div className="lesson-grid">
        {lessons.map((l, i) => {
          const status = lessonStatus(l, data);
          return (
            <Link
              key={l.id}
              className={`lesson-card ${i === 0 ? "recommended" : ""}`}
              to={`/lesson/${l.id}`}
            >
              <div className="lesson-card-top">
                <span>LESSON {num(i + 1)}</span>
                <span
                  className={`status ${status === "復習推奨" ? "review" : ""}`}
                >
                  {status}
                </span>
              </div>
              <span className="lesson-symbol">
                {["♠", "♥", "♦", "♣"][i % 4]}
              </span>
              <h2>{l.title}</h2>
              <p>{l.description}</p>
              <div className="lesson-meta">
                <span>初級 · {l.estimatedMinutes}分</span>
                <span>
                  正答率{" "}
                  {rate(
                    accuracy(data.answers.filter((a) => a.lessonId === l.id)),
                  )}
                </span>
                <b>↗</b>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
function LessonRoute() {
  const { id } = useParams();
  const lesson = lessons.find((l) => l.id === id);
  return lesson ? (
    <LessonPlayer key={id} lesson={lesson} />
  ) : (
    <main className="page">
      <h1>教材が見つかりません</h1>
      <Link to="/academy">教材一覧へ</Link>
    </main>
  );
}
function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const { data, update } = useLearning(),
    navigate = useNavigate();
  const stored = data.progress[lesson.id];
  const [stepIndex, setStepIndex] = useState(
      stored?.version === lesson.version
        ? Math.min(stored.step, lesson.steps.length)
        : 0,
    ),
    [answer, setAnswer] = useState(""),
    [result, setResult] = useState<boolean | null>(null),
    [panel, setPanel] = useState(true),
    [selected, setSelected] = useState<string[]>([]),
    [round, setRound] = useState(0),
    [dealer, setDealer] = useState(0),
    [added, setAdded] = useState(0),
    [flipped, setFlipped] = useState(true),
    [transition, setTransition] = useState(false),
    [phase, setPhase] = useState(0);
  const submitted = useRef(false),
    touchX = useRef(0);
  const step = lesson.steps[stepIndex];
  const done = stepIndex >= lesson.steps.length;
  const q = step?.question;
  useEffect(() => {
    update((d) => ({
      ...d,
      lastLesson: lesson.id,
      progress: {
        ...d.progress,
        [lesson.id]: {
          step: stepIndex,
          completed:
            d.progress[lesson.id]?.completed ||
            stepIndex >= lesson.steps.length,
          updatedAt: new Date().toISOString(),
          version: lesson.version,
        },
      },
    }));
  }, [stepIndex, lesson, update]);
  useEffect(() => {
    if (!transition) return;
    const timer = setInterval(() => setPhase((p) => p + 1), 350);
    return () => clearInterval(timer);
  }, [transition]);
  useEffect(() => {
    if (phase >= 6) navigate("/casino");
  }, [phase, navigate]);
  function move(index: number) {
    setStepIndex(index);
    setAnswer("");
    setResult(null);
    setSelected([]);
    setRound(0);
    setAdded(0);
    setFlipped(true);
    submitted.current = false;
  }
  function submit() {
    if (!q || submitted.current || !answer.trim()) return;
    submitted.current = true;
    const correct = grade(
      answer,
      q.answer,
      q.kind === "number" ? (q.tolerance ?? 1e-9) : q.tolerance,
    );
    setResult(correct);
    update((d) => ({
      ...d,
      answers: [
        ...d.answers,
        {
          id: crypto.randomUUID(),
          lessonId: lesson.id,
          lessonVersion: lesson.version,
          questionId: q.id,
          questionVersion: q.version,
          answer,
          correct,
          correctAnswer: q.answer,
          topic: q.topic,
          answeredAt: new Date().toISOString(),
        },
      ],
    }));
  }
  const base = step?.tableState ?? sampleTable;
  const state = { ...base, pot: (base.pot ?? 150) + added, dealer };
  const select = (c: Card) => {
    const key = c.rank + c.suit;
    setSelected((old) =>
      old.includes(key)
        ? old.filter((x) => x !== key)
        : old.length < 5
          ? [...old, key]
          : old,
    );
  };
  const chosen = [...state.hole, ...state.board].filter((c) =>
    selected.includes(c.rank + c.suit),
  );
  const nextLesson = lessons[lessons.indexOf(lesson) + 1];
  if (done)
    return (
      <main className="completion page">
        <span className="completion-medal">♠</span>
        <div className="eyebrow">LESSON COMPLETE</div>
        <h1>また一歩、テーブルに近づいた。</h1>
        <p>
          「{lesson.title}」を修了しました。結果はこのブラウザに保存されます。
        </p>
        <div className="completion-score">
          今回までの正答率{" "}
          <strong>
            {rate(
              accuracy(data.answers.filter((a) => a.lessonId === lesson.id)),
            )}
          </strong>
        </div>
        {needsReview(data.answers, lesson.id) && (
          <p>
            間違えた問題があります。解説を読み直して、理解を確かめましょう。
          </p>
        )}
        <ActionButtons>
          {nextLesson && (
            <Link className="button primary" to={`/lesson/${nextLesson.id}`}>
              次のレッスンへ →
            </Link>
          )}
          <button onClick={() => move(0)}>復習する</button>
          <Link className="button" to="/room">
            学習記録を見る
          </Link>
          <button
            onClick={() => {
              setTransition(true);
              setPhase(0);
            }}
          >
            実戦のテーブルを見てみる
          </button>
        </ActionButtons>
        <Link className="text-link" to="/academy">
          教材一覧へ戻る
        </Link>
        {transition && (
          <div
            className={`transition-scene phase-${phase}`}
            role="dialog"
            aria-label="カジノへの移動"
          >
            <div className="transition-glow" />
            <PokerTable
              state={{
                ...sampleTable,
                seats: phase >= 3,
                pot: phase >= 4 ? 500 : 0,
              }}
            />
            <div className="transition-caption">
              <span className="eyebrow">
                {
                  [
                    "ACADEMY · 照明を落としています",
                    "カジノへ移動しています",
                    "CASINO · 照明が灯ります",
                    "プレイヤー席を準備しています",
                    "チップを配置しています",
                    "プレビューテーブルへようこそ",
                  ][Math.min(phase, 5)]
                }
              </span>
              <button onClick={() => navigate("/casino")}>
                演出をスキップ →
              </button>
            </div>
          </div>
        )}
      </main>
    );
  return (
    <main className="lesson-page">
      <div className="lesson-top">
        <Link to="/academy">← 教材一覧</Link>
        <span>
          LESSON {lesson.id.slice(-2)} <b>{lesson.title}</b>
        </span>
        <small>初級 · v{lesson.version}</small>
      </div>
      <div className="lesson-layout">
        <aside className="step-sidebar">
          <div className="eyebrow">YOUR LESSON</div>
          <h2>{lesson.title}</h2>
          <LessonProgress step={stepIndex} total={lesson.steps.length} />
          <ol>
            {lesson.steps.map((s, i) => (
              <li
                className={
                  i === stepIndex ? "current" : i < stepIndex ? "passed" : ""
                }
                key={s.id}
              >
                <span>{i < stepIndex ? "✓" : num(i + 1)}</span>
                {i === 0
                  ? "テーマを知る"
                  : i === 1
                    ? "テーブルで体験"
                    : `理解度チェック ${i - 1}`}
              </li>
            ))}
          </ol>
          <div className="sidebar-bottom">
            NO LIMIT
            <br />
            TEXAS HOLD’EM
            <br />
            <span>はじめての一手を、ここから。</span>
          </div>
        </aside>
        <section className="lesson-center">
          <div className="table-heading">
            <span className="eyebrow">
              {step.type === "quiz" ? "KNOWLEDGE CHECK" : "INTERACTIVE TABLE"}
            </span>
            <h2>
              {step.type === "quiz"
                ? `理解度チェック ${stepIndex - 1} / 3`
                : stepIndex === 0
                  ? "まずは、仕組みを知ろう。"
                  : "カードに触れてみよう。"}
            </h2>
          </div>
          <div
            onTouchStart={(e) => {
              touchX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (step.interaction === "deal") {
                const d = e.changedTouches[0].clientX - touchX.current;
                if (Math.abs(d) > 40)
                  setRound((r) =>
                    Math.max(0, Math.min(4, r + (d < 0 ? 1 : -1))),
                  );
              }
            }}
          >
            <PokerTable
              state={state}
              select={step.interaction === "select-five" ? select : undefined}
              selected={selected}
              reveal={step.interaction === "deal" ? [0, 3, 4, 5, 5][round] : 5}
              flipped={step.interaction === "flip" && flipped}
              flip={
                step.interaction === "flip"
                  ? () => setFlipped((f) => !f)
                  : undefined
              }
            />
          </div>
          <div className="table-controls">
            {step.interaction === "select-five" && (
              <>
                <span>
                  {selected.length} / 5 枚を選択{" "}
                  {chosen.length === 5 && <b> · {evaluate(chosen).name}</b>}
                </span>
                <button onClick={() => setSelected([])}>選択を戻す</button>
              </>
            )}
            {step.interaction === "deal" && (
              <>
                <button
                  disabled={round === 0}
                  onClick={() => setRound((r) => r - 1)}
                >
                  ← 戻す
                </button>
                <strong>
                  {
                    [
                      "プリフロップ",
                      "フロップ",
                      "ターン",
                      "リバー",
                      "ショーダウン",
                    ][round]
                  }
                </strong>
                <button onClick={() => setRound((r) => (r + 1) % 5)}>
                  {round === 4 ? "最初から" : "次のラウンド →"}
                </button>
              </>
            )}
            {step.interaction === "button" && (
              <button onClick={() => setDealer((d) => (d + 1) % 6)}>
                ボタンを時計回りに動かす ↻
              </button>
            )}
            {step.interaction === "chips" && (
              <>
                <button
                  disabled={added === 0}
                  onClick={() => setAdded((a) => Math.max(0, a - 25))}
                >
                  25 戻す
                </button>
                <span>追加 {added} チップ</span>
                <button
                  disabled={added >= 500}
                  onClick={() => setAdded((a) => a + 25)}
                >
                  25 チップを加える
                </button>
              </>
            )}
            {step.interaction === "flip" && (
              <button onClick={() => setFlipped((f) => !f)}>
                手札を{flipped ? "開く" : "伏せる"} ↻
              </button>
            )}
            {!step.interaction && (
              <span>
                {step.type === "quiz"
                  ? "右の問題に回答して、理解を確かめましょう。"
                  : "まず解説を読み、次のステップで操作しましょう。"}
              </span>
            )}
          </div>
        </section>
        <ExplanationPanel open={panel} toggle={() => setPanel((p) => !p)}>
          <div className="eyebrow">{q ? "YOUR TURN" : "LESSON NOTES"}</div>
          <h2>
            {q
              ? q.prompt
              : stepIndex === 0
                ? lesson.title
                : "触れて、確かめる。"}
          </h2>
          {!q ? (
            <>
              <p className="lesson-text">{step.content}</p>
              {stepIndex === 0 && (
                <ul className="objectives">
                  {lesson.learningObjectives.map((o) => (
                    <li key={o}>✓ {o}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <p className="situation">{q.situation}</p>
              {q.kind === "number" ? (
                <label className="numeric-label">
                  数値で回答（半角）
                  <input
                    aria-label="数値で回答"
                    type="number"
                    inputMode="decimal"
                    value={answer}
                    disabled={result !== null}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submit();
                    }}
                    placeholder="例：25"
                  />
                </label>
              ) : (
                <div className="options">
                  {q.options?.map((o, i) => (
                    <button
                      key={o}
                      className={`${answer === o ? "chosen" : ""} ${result !== null && o === q.answer ? "correct-option" : ""}`}
                      onClick={() => setAnswer(o)}
                      disabled={result !== null}
                    >
                      <span>{String.fromCharCode(65 + i)}</span>
                      {o}
                    </button>
                  ))}
                </div>
              )}
              {result === null ? (
                <button
                  className="primary submit"
                  disabled={!answer.trim()}
                  onClick={submit}
                >
                  回答を確認する →
                </button>
              ) : (
                <div
                  className={`answer-result ${result ? "correct" : "incorrect"}`}
                  role="status"
                >
                  <strong>
                    {result ? "✓ 正解です" : "もう一度、ポイントを確認"}
                  </strong>
                  <p>正しい回答：{q.answer}</p>
                  <p>{q.explanation}</p>
                  <p>
                    <b>間違いやすいポイント</b>
                    <br />
                    {q.pitfall}
                  </p>
                  <small>関連知識：{q.related}</small>
                </div>
              )}
            </>
          )}
          <SourceReference ids={q?.sourceIds ?? step.sourceIds} />
          <div className="lesson-next">
            <button
              onClick={() => move(Math.max(0, stepIndex - 1))}
              disabled={stepIndex === 0}
            >
              ← 戻る
            </button>
            <button
              className="primary"
              disabled={!!q && result === null}
              onClick={() => move(stepIndex + 1)}
            >
              {stepIndex === lesson.steps.length - 1
                ? "レッスンを修了 ✓"
                : "次へ進む →"}
            </button>
          </div>
        </ExplanationPanel>
      </div>
    </main>
  );
}
function Casino() {
  return (
    <main className="casino-page page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">AFTER HOURS · CASINO</div>
          <h1>次の舞台が、待っている。</h1>
          <p>灯りのついたテーブルへようこそ。実践モードのプレビューです。</p>
        </div>
        <span className="status">PREVIEW ONLY</span>
      </div>
      <PokerTable
        state={{ ...sampleTable, seats: true, dealer: 0, pot: 500 }}
      />
      <div className="casino-info">
        <div>
          <h2>実戦は、これから。</h2>
          <p>
            CPU対戦・オンライン対戦は <b>Coming Soon</b>。<br />
            現在は見学のみです。対戦やチップの購入はできません。
          </p>
        </div>
        <Link to="/academy" className="button primary">
          ACADEMYで学ぶ →
        </Link>
      </div>
    </main>
  );
}
function Room() {
  const { data } = useLearning(),
    stats = useStats();
  const topics = [...new Set(lessons.map((l) => l.topic))],
    review = lessons.filter((l) => needsReview(data.answers, l.id));
  return (
    <main className="page room-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR PERSONAL SPACE · MY ROOM</div>
          <h1>積み重ねた、一手の記録。</h1>
          <p>学びの軌跡を振り返り、次の一歩を見つけましょう。</p>
        </div>
        <Link className="button" to="/academy">
          学習へ戻る ↗
        </Link>
      </div>
      <div className="stat-grid">
        <div>
          <span>修了レッスン</span>
          <strong>
            {stats.completed}
            <small>/ 10</small>
          </strong>
        </div>
        <div>
          <span>総回答数</span>
          <strong>
            {stats.total}
            <small>問</small>
          </strong>
        </div>
        <div>
          <span>総合正答率</span>
          <strong>{rate(stats.rate)}</strong>
        </div>
        <div>
          <span>学習進捗</span>
          <strong>
            {stats.completed * 10}
            <small>%</small>
          </strong>
        </div>
      </div>
      <div className="room-columns">
        <section className="room-panel">
          <h2>分野別の理解度</h2>
          {topics.map((t) => {
            const answers = data.answers.filter((a) => a.topic === t);
            const a = accuracy(answers);
            return (
              <div className="topic-row" key={t}>
                <span>{t}</span>
                <progress max={100} value={a ?? 0} />
                <b>{rate(a)}</b>
                <small>{answers.length}問</small>
              </div>
            );
          })}
        </section>
        <section className="room-panel">
          <h2>
            もう一度、確かめよう <span>{review.length}</span>
          </h2>
          {review.length ? (
            review.map((l) => (
              <Link className="review-link" key={l.id} to={`/lesson/${l.id}`}>
                {l.title}
                <span>復習へ →</span>
              </Link>
            ))
          ) : (
            <p className="empty">
              {stats.total
                ? "現在、復習が必要な問題はありません。"
                : "まだ回答履歴がありません。最初のレッスンから始めましょう。"}
            </p>
          )}
          <p className="muted">
            各問題の最新回答が不正解なら、復習対象になります。正答率はすべての回答を集計します。
          </p>
        </section>
      </div>
      <section className="room-panel history">
        <h2>最近の学習履歴</h2>
        {data.answers.length ? (
          <div className="history-scroll">
            <table>
              <thead>
                <tr>
                  <th>回答日時</th>
                  <th>レッスン／問題</th>
                  <th>回答</th>
                  <th>結果</th>
                  <th>教材版</th>
                </tr>
              </thead>
              <tbody>
                {data.answers
                  .slice(-15)
                  .reverse()
                  .map((a) => (
                    <tr key={a.id}>
                      <td>{new Date(a.answeredAt).toLocaleString("ja-JP")}</td>
                      <td>
                        {lessons.find((l) => l.id === a.lessonId)?.title ??
                          a.lessonId}
                        <small>{a.questionId}</small>
                      </td>
                      <td>{a.answer}</td>
                      <td className={a.correct ? "positive" : "negative"}>
                        {a.correct ? "正解" : "不正解"}
                      </td>
                      <td>v{a.lessonVersion}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">あなたの最初の一手を待っています。</p>
        )}
      </section>
    </main>
  );
}
function Settings() {
  const { data, update, reset } = useLearning();
  const [confirm, setConfirm] = useState(false);
  function download() {
    let raw: string;
    try {
      raw = localStorage.getItem(STORAGE_KEY) ?? JSON.stringify(data);
    } catch {
      raw = JSON.stringify(data);
    }
    const url = URL.createObjectURL(
      new Blob([raw], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "poker-academy-progress.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <main className="page settings-page">
      <div className="eyebrow">YOUR PREFERENCES</div>
      <h1>設定</h1>
      <section className="room-panel">
        <h2>表示と保存</h2>
        <label className="toggle-row">
          <span>
            アニメーションを減らす
            <small>端末側の動きを減らす設定にも対応します。</small>
          </span>
          <input
            type="checkbox"
            checked={data.reducedMotion}
            onChange={(e) =>
              update((d) => ({ ...d, reducedMotion: e.target.checked }))
            }
          />
        </label>
        <p>
          学習記録は、この端末・このブラウザのlocalStorageに保存します。オンライン同期はありません。
        </p>
        <ActionButtons>
          <button onClick={download}>学習データを書き出す</button>
          <button className="danger" onClick={() => setConfirm(true)}>
            学習履歴をリセット
          </button>
        </ActionButtons>
        {confirm && (
          <div
            className="confirmation"
            role="alertdialog"
            aria-label="学習履歴の削除確認"
          >
            <p>このブラウザの学習履歴と設定を削除します。元に戻せません。</p>
            <button onClick={() => setConfirm(false)}>キャンセル</button>
            <button className="danger" onClick={reset}>
              削除する
            </button>
          </div>
        )}
      </section>
      <section className="room-panel">
        <h2>教材の更新履歴</h2>
        <p>
          教材と問題は回答時点のバージョンを記録し、過去の採点を自動で変更しません。
        </p>
        <details>
          <summary>初回リリースの記録を見る</summary>
          {curriculumChanges.map((c) => (
            <p key={c.lessonId}>
              {c.updatedAt} · {c.lessonId} · 新規 → {c.newVersion}
              <br />
              {c.description} / 理由：{c.reason}
              <br />
              根拠：{c.sourceIds.join(", ")}
            </p>
          ))}
        </details>
      </section>
    </main>
  );
}
