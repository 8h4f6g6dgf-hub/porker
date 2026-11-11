import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { useLearning } from "../persistence/context";
import { PokerTable, PlayingCard } from "../components/Table";
import { sampleTable } from "../data/lessons";
import { SourceReference } from "../components/Learning";
import {
  initialIntroState,
  introReducer,
  introQuestion,
  resultLines,
  sceneFor,
} from "./scenario";
import { useDealerAudio } from "./audio";
import "./immersive.css";
const Scene = lazy(() => import("./CasinoScene"));
class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function webGLAvailable() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
function seenBefore() {
  try {
    return localStorage.getItem("poker-academy.intro-seen.v2") === "yes";
  } catch {
    return false;
  }
}
export default function Experience({
  mode = "academy",
}: {
  mode?: "academy" | "casino";
}) {
  const { data, update } = useLearning();
  const [state, dispatch] = useReducer(
    introReducer,
    undefined,
    initialIntroState,
  );
  const [seen, setSeen] = useState(seenBefore),
    [audioOpen, setAudioOpen] = useState(false),
    [details, setDetails] = useState(false),
    [fallback, setFallback] = useState(() => !webGLAvailable()),
    [ready, setReady] = useState(false),
    [attempt, setAttempt] = useState(0),
    [motionReduced, setMotionReduced] = useState(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [busy, setBusy] = useState(false);
  const reduced = data.reducedMotion || motionReduced;
  const audio = useDealerAudio();
  const submitted = useRef(false);
  const phase = mode === "casino" ? "choose" : state.phase;
  const script = sceneFor(phase);
  const lines =
    phase === "result"
      ? resultLines(state.answer)
      : mode === "casino"
        ? [
            "実戦の舞台へ、ようこそ。",
            "CPU・オンライン対戦は Coming Soon。いまはテーブルを見学できます。",
          ]
        : script.lines;
  const text = lines.join(" ");
  const onReady = useCallback(() => setReady(true), []);
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const f = () => setMotionReduced(q.matches);
    q.addEventListener("change", f);
    return () => q.removeEventListener("change", f);
  }, []);
  useEffect(() => {
    if (fallback) setReady(true);
  }, [fallback]);
  useEffect(() => {
    if (phase === "choose") {
      setSeen(true);
      try {
        localStorage.setItem("poker-academy.intro-seen.v2", "yes");
      } catch {
        /* Learning progress repository handles save warnings separately. */
      }
    }
  }, [phase]);
  useEffect(() => {
    if (!ready || mode === "casino" || phase !== "entrance") return;
    const t = setTimeout(
      () => dispatch({ type: "NEXT" }),
      reduced ? 300 : seen ? 1800 : 6000,
    );
    return () => clearTimeout(t);
  }, [ready, mode, phase, reduced, seen]);
  useEffect(() => {
    audio.speak(text);
    return audio.stop;
  }, [text, audio.speak, audio.stop]);
  useEffect(() => {
    setBusy(["deal", "flop", "turn", "river"].includes(phase));
    const t = setTimeout(
      () => setBusy(false),
      reduced ? 0 : phase === "deal" ? 2100 : 1000,
    );
    return () => clearTimeout(t);
  }, [phase, reduced]);
  useEffect(() => {
    if (["deal", "flop", "turn", "river"].includes(phase)) audio.effect("card");
  }, [phase, audio.effect]);
  function reveal(index: number) {
    if (phase !== "reveal") return;
    audio.unlock();
    audio.effect("card");
    dispatch({ type: "REVEAL", index });
  }
  function next() {
    audio.unlock();
    audio.stop();
    dispatch({ type: "NEXT" });
  }
  function answer(value: string) {
    if (submitted.current || state.answer !== null || phase !== "quiz") return;
    submitted.current = true;
    dispatch({ type: "ANSWER", answer: value });
    audio.effect("answer");
    const now = new Date().toISOString();
    update((d) => ({
      ...d,
      answers: [
        ...d.answers,
        {
          id: crypto.randomUUID(),
          lessonId: introQuestion.lessonId,
          lessonVersion: introQuestion.lessonVersion,
          questionId: introQuestion.id,
          questionVersion: introQuestion.version,
          answer: value,
          correct: value === introQuestion.answer,
          correctAnswer: introQuestion.answer,
          topic: introQuestion.topic,
          answeredAt: now,
        },
      ],
    }));
  }
  function connectLesson() {
    update((d) => ({
      ...d,
      lastLesson: "lesson-01",
      progress: {
        ...d.progress,
        "lesson-01": d.progress["lesson-01"] ?? {
          step: 0,
          completed: false,
          updatedAt: new Date().toISOString(),
          version: "1.0.0",
        },
      },
    }));
  }
  const fallbackView = (
    <div className="immersive-fallback">
      <PokerTable
        state={{
          ...sampleTable,
          board: sampleTable.board.slice(
            0,
            mode === "casino" ? 5 : script.communityCount,
          ),
          hole: [],
        }}
      />
      {!["entrance", "seat", "choose"].includes(phase) && (
        <div className="fallback-hole">
          {sampleTable.hole.map((card, i) => (
            <PlayingCard
              key={i}
              card={card}
              back={!state.revealed[i]}
              onClick={
                phase === "reveal" && !state.revealed[i]
                  ? () => reveal(i)
                  : undefined
              }
            />
          ))}
        </div>
      )}
      <p>軽量表示 · 3Dを利用できない環境でも、下のボタンで学習できます。</p>
    </div>
  );
  return (
    <main
      className={`immersive ${mode === "casino" ? "immersive-casino" : ""}`}
      data-phase={phase}
    >
      <div className="scene-viewport">
        <SceneBoundary
          key={attempt}
          fallback={fallbackView}
          onError={() => {
            setFallback(true);
            setReady(true);
          }}
        >
          {fallback ? (
            fallbackView
          ) : (
            <Suspense
              fallback={
                <div className="scene-loading">
                  テーブルの灯りを、ともしています…
                </div>
              }
            >
              <Scene
                phase={phase}
                revealed={mode === "casino" ? [true, true] : state.revealed}
                communityCount={mode === "casino" ? 5 : script.communityCount}
                onReveal={reveal}
                reducedMotion={reduced}
                mode={mode}
                onReady={onReady}
              />
            </Suspense>
          )}
        </SceneBoundary>
      </div>
      <div className="cinema-shade" />
      <header className="experience-top">
        <Link to="/" className="experience-brand">
          ♠{" "}
          <span>
            POKER ACADEMY<small>ONE CASINO. TWO EXPERIENCES.</small>
          </span>
        </Link>
        <div className="experience-tools">
          <span>字幕ガイド</span>
          <button
            aria-label="音声と表示の設定"
            onClick={() => setAudioOpen((v) => !v)}
          >
            設定
          </button>
          <Link to="/lobby">ロビー</Link>
        </div>
      </header>
      <div className="chapter-label">
        <span className="chapter-line" />
        <span>
          {mode === "casino"
            ? "CASINO · TABLE PREVIEW"
            : `CHAPTER ${String(script.scene).padStart(2, "0")} / 08`}
        </span>
        <small>
          {mode === "casino" ? "同じテーブル、違う夜。" : script.title}
        </small>
      </div>
      {phase === "entrance" && mode === "academy" && (
        <div className="entrance-title">
          <span>THE PRIVATE POKER ROOM</span>
          <h1>
            あなたの席が、
            <br />
            <em>待っています。</em>
          </h1>
          <p>カードに触れる。ポーカーがわかる。</p>
        </div>
      )}
      {audioOpen && (
        <aside className="audio-popover" aria-label="音声設定">
          <button className="popover-close" onClick={() => setAudioOpen(false)}>
            閉じる ×
          </button>
          <h2>テーブルの音と表示</h2>
          <label>
            効果音量
            <input
              type="range"
              min="0"
              max="1"
              step=".05"
              value={audio.preferences.effectsVolume}
              onChange={(e) =>
                audio.setPreferences((p) => ({
                  ...p,
                  effectsVolume: Number(e.target.value),
                }))
              }
            />
          </label>
          <p>字幕と効果音でご案内します。</p>
          <label>
            <input
              type="checkbox"
              checked={data.reducedMotion}
              onChange={(e) =>
                update((d) => ({ ...d, reducedMotion: e.target.checked }))
              }
            />{" "}
            動きを減らす
          </label>
          <button
            onClick={() => {
              setAttempt((a) => a + 1);
              setFallback((v) => !v);
            }}
          >
            {fallback ? "3D表示を試す" : "軽量表示に切り替える"}
          </button>
        </aside>
      )}
      <section className="experience-console" aria-label="ディーラーの案内">
        <div className="dealer-caption">
          <div className="dealer-caption-label">
            <span className={audio.speaking ? "speaking-dot" : "quiet-dot"} />{" "}
            YOUR DEALER <span>日本語ガイド</span>
          </div>
          <p key={phase} aria-live="polite">
            {text}
          </p>
          {audio.notice && (
            <small className="audio-notice" role="status">
              {audio.notice}
            </small>
          )}
        </div>
        <div className="experience-actions">
          {mode === "casino" ? (
            <>
              <span className="preview-note">見学専用 · Coming Soon</span>
              <Link className="button primary" to="/">
                ACADEMYへ →
              </Link>
              <Link className="button" to="/casino/classic">
                従来のテーブルを見る
              </Link>
            </>
          ) : (
            <>
              {phase === "entrance" && (
                <>
                  <button
                    className="primary"
                    onClick={() => {
                      audio.unlock();
                      dispatch({ type: "NEXT" });
                    }}
                  >
                    席へ進む →
                  </button>
                  <button onClick={() => dispatch({ type: "SKIP_INTRO" })}>
                    {seen ? "演出を短縮して着席" : "演出をスキップ"}
                  </button>
                </>
              )}
              {phase === "choose" && (
                <div className="experience-menu">
                  <button
                    className="experience-menu-main"
                    onClick={() => {
                      audio.unlock();
                      submitted.current = false;
                      dispatch({ type: "START_LESSON" });
                    }}
                  >
                    <span>01 / LEARN</span>
                    <strong>
                      ACADEMY <b>↗</b>
                    </strong>
                    <small>ディーラーと、最初のレッスンへ。</small>
                  </button>
                  <Link to="/casino">
                    <span>02 / PRACTICE</span>
                    <strong>CASINO</strong>
                    <small>実戦の舞台を見学 · PREVIEW</small>
                  </Link>
                  <Link to="/room">
                    <span>03 / REFLECT</span>
                    <strong>MY PROFILE</strong>
                    <small>あなたの学びの記録</small>
                  </Link>
                </div>
              )}
              {phase === "reveal" && (
                <>
                  <div className="reveal-actions">
                    {state.revealed.map((v, i) => (
                      <button
                        key={i}
                        disabled={v}
                        aria-label={`手札${i + 1}をめくる`}
                        onClick={() => reveal(i)}
                      >
                        {v
                          ? i === 0
                            ? "A ♥"
                            : "K ♥"
                          : `手札 ${i + 1} をめくる ↻`}
                      </button>
                    ))}
                  </div>
                  <button
                    className="primary"
                    disabled={!state.revealed.every(Boolean)}
                    onClick={next}
                  >
                    ハンドについて聞く →
                  </button>
                </>
              )}
              {phase === "quiz" && (
                <div className="intro-quiz" aria-label={introQuestion.prompt}>
                  {introQuestion.options.map((a) => (
                    <button onClick={() => answer(a)} key={a}>
                      {a}
                    </button>
                  ))}
                </div>
              )}
              {phase === "result" && (
                <>
                  <span
                    className={
                      state.answer === introQuestion.answer
                        ? "result-pass"
                        : "result-retry"
                    }
                    role="status"
                  >
                    {state.answer === introQuestion.answer
                      ? "✓ 正解 · 最初の一手を理解しました"
                      : "正解は2枚 · 手札を確認しましょう"}
                  </span>
                  <button className="primary" onClick={next}>
                    学びを続ける →
                  </button>
                </>
              )}
              {phase === "continue" && (
                <>
                  <Link
                    className="button primary"
                    to="/lesson/lesson-01"
                    onClick={connectLesson}
                  >
                    レッスン01を続ける →
                  </Link>
                  <Link className="button" to="/academy">
                    10レッスンを見る
                  </Link>
                </>
              )}
              {["seat", "deal", "hand", "flop", "turn", "river"].includes(
                phase,
              ) && (
                <button className="primary" disabled={busy} onClick={next}>
                  {busy
                    ? "カードを配っています…"
                    : phase === "seat"
                      ? "着席する →"
                      : phase === "deal"
                        ? "カードを確認する →"
                        : phase === "river"
                          ? "最初のクイズへ →"
                          : "次へ進む →"}
                </button>
              )}
            </>
          )}
        </div>
        <div className="experience-bottom">
          <div>
            {mode === "academy" && phase !== "entrance" && (
              <button
                onClick={() => {
                  audio.stop();
                  dispatch({ type: "BACK" });
                }}
              >
                ← 戻る
              </button>
            )}
          </div>
          <div>
            {script.sourceIds.length > 0 && (
              <button onClick={() => setDetails((v) => !v)}>
                解説の根拠 ＋
              </button>
            )}
            <Link to="/academy">教材一覧へ</Link>
            <span>2.0 PROTOTYPE</span>
          </div>
        </div>
        {details && (
          <div className="intro-sources">
            <SourceReference ids={[...script.sourceIds]} />
          </div>
        )}
      </section>
    </main>
  );
}
