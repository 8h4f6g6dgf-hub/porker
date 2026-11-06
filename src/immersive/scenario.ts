/** A lesson script independent of React, Three.js, speech, and persistence. */
export type Phase =
  | "entrance"
  | "seat"
  | "choose"
  | "deal"
  | "reveal"
  | "hand"
  | "flop"
  | "turn"
  | "river"
  | "quiz"
  | "result"
  | "continue";

export interface ScenarioScene {
  id: Phase;
  /** User-facing story chapter, rather than the internal animation step. */
  scene: number;
  title: string;
  lines: readonly string[];
  /** Minimum visual/read time. null means an explicit learner action is needed. */
  durationMs: number | null;
  communityCount: number;
  sourceIds: readonly string[];
}

export const scenario: readonly ScenarioScene[] = [
  {
    id: "entrance",
    scene: 1,
    title: "CASINO ENTRANCE",
    lines: ["灯りの先に、あなたのテーブルが待っています。"],
    durationMs: 6000,
    communityCount: 0,
    sourceIds: [],
  },
  {
    id: "seat",
    scene: 2,
    title: "TAKE A SEAT",
    lines: [
      "ようこそ、Poker Academyへ。",
      "ここでは、実際にカードに触れながらポーカーを学んでいきます。",
      "まずは、あなたの席へどうぞ。",
    ],
    durationMs: 16000,
    communityCount: 0,
    sourceIds: [],
  },
  {
    id: "choose",
    scene: 3,
    title: "YOUR EXPERIENCE",
    lines: ["本日は、何から始めましょうか？"],
    durationMs: null,
    communityCount: 0,
    sourceIds: [],
  },
  {
    id: "deal",
    scene: 4,
    title: "LESSON 01 · 最初の2枚",
    lines: [
      "それでは、最初のレッスンを始めましょう。",
      "テキサスホールデムでは、最初に各プレイヤーへ2枚のカードが配られます。",
    ],
    durationMs: 14000,
    communityCount: 0,
    sourceIds: ["holdem"],
  },
  {
    id: "reveal",
    scene: 5,
    title: "YOUR HOLE CARDS",
    lines: ["カードを1枚ずつタップして、確認してください。"],
    durationMs: null,
    communityCount: 0,
    sourceIds: ["holdem"],
  },
  {
    id: "hand",
    scene: 5,
    title: "あなただけのハンド",
    lines: [
      "この2枚が、あなたのハンドです。",
      "このカードと、テーブルに公開される5枚のカードを組み合わせて、最も強い5枚の役を作ります。",
      "自分のカードは、0枚、1枚、2枚のどの使い方でも構いません。",
    ],
    durationMs: 22000,
    communityCount: 0,
    sourceIds: ["holdem"],
  },
  {
    id: "flop",
    scene: 6,
    title: "FLOP · 共通カード3枚",
    lines: [
      "テーブルの中央には、全員が使えるカードが公開されます。",
      "最初の3枚がフロップ。",
    ],
    durationMs: 10000,
    communityCount: 3,
    sourceIds: ["holdem"],
  },
  {
    id: "turn",
    scene: 6,
    title: "TURN · 4枚目",
    lines: ["4枚目がターン。共通カードは、全部で4枚になりました。"],
    durationMs: 6500,
    communityCount: 4,
    sourceIds: ["holdem"],
  },
  {
    id: "river",
    scene: 6,
    title: "RIVER · 最後の1枚",
    lines: [
      "最後の1枚がリバーです。",
      "実際のゲームでは、各段階の間にチップを賭けるベットを行います。いまはカードの流れを見ています。",
    ],
    durationMs: 14000,
    communityCount: 5,
    sourceIds: ["holdem"],
  },
  {
    id: "quiz",
    scene: 7,
    title: "FIRST QUESTION",
    lines: [
      "では、確認してみましょう。",
      "テキサスホールデムで、最初に配られる自分のカードは何枚でしょう？",
    ],
    durationMs: null,
    communityCount: 5,
    sourceIds: ["holdem"],
  },
  {
    id: "result",
    scene: 7,
    title: "一手の理解を、確かめる",
    lines: [],
    durationMs: null,
    communityCount: 5,
    sourceIds: ["holdem"],
  },
  {
    id: "continue",
    scene: 8,
    title: "YOUR NEXT HAND",
    lines: [
      "最初の一歩ができました。",
      "続けて、役の作り方と勝ち方を学んでいきましょう。",
    ],
    durationMs: null,
    communityCount: 5,
    sourceIds: ["holdem"],
  },
];

export function sceneFor(phase: Phase): ScenarioScene {
  return scenario.find((scene) => scene.id === phase)!;
}

export const introQuestion = {
  id: "intro-v2-hole-cards",
  version: "2.0.0",
  lessonId: "lesson-01",
  lessonVersion: "1.0.0",
  prompt: "テキサスホールデムで、最初に配られる自分のカードは何枚でしょう？",
  options: ["2枚", "3枚", "5枚"] as const,
  answer: "2枚",
  topic: "基本ルール",
  sourceIds: ["holdem"],
};

export function resultLines(answer: string | null): readonly string[] {
  return answer === introQuestion.answer
    ? [
        "その通りです。最初に配られるのは2枚です。",
        "この2枚と共通カード5枚から、最も強い5枚を選びます。",
      ]
    : [
        "惜しいですね。最初に配られるのは2枚です。もう一度確認してみましょう。",
        "手元の2枚があなただけのカード、中央の5枚は全員の共通カードです。",
      ];
}

export interface IntroState {
  phase: Phase;
  revealed: [boolean, boolean];
  answer: string | null;
}

export type IntroEvent =
  | { type: "NEXT" }
  | { type: "SKIP_INTRO" }
  | { type: "START_LESSON" }
  | { type: "REVEAL"; index: number }
  | { type: "ANSWER"; answer: string }
  | { type: "BACK" }
  | { type: "RESTART" };

export function initialIntroState(): IntroState {
  return { phase: "entrance", revealed: [false, false], answer: null };
}

export function introReducer(state: IntroState, event: IntroEvent): IntroState {
  switch (event.type) {
    case "RESTART":
      return initialIntroState();
    case "SKIP_INTRO":
      return state.phase === "entrance" || state.phase === "seat"
        ? { ...state, phase: "choose" }
        : state;
    case "START_LESSON":
      return state.phase === "choose"
        ? { ...state, phase: "deal", revealed: [false, false], answer: null }
        : state;
    case "REVEAL": {
      if (
        state.phase !== "reveal" ||
        (event.index !== 0 && event.index !== 1) ||
        state.revealed[event.index]
      )
        return state;
      const revealed: [boolean, boolean] = [...state.revealed];
      revealed[event.index] = true;
      return { ...state, revealed };
    }
    case "ANSWER":
      if (
        state.phase !== "quiz" ||
        state.answer !== null ||
        !introQuestion.options.some((answer) => answer === event.answer)
      )
        return state;
      return { ...state, phase: "result", answer: event.answer };
    case "NEXT": {
      if (
        state.phase === "choose" ||
        state.phase === "quiz" ||
        state.phase === "continue"
      )
        return state;
      if (state.phase === "reveal" && !state.revealed.every(Boolean))
        return state;
      if (state.phase === "river" && state.answer !== null)
        return { ...state, phase: "result" };
      const index = scenario.findIndex((scene) => scene.id === state.phase);
      return { ...state, phase: scenario[index + 1].id };
    }
    case "BACK": {
      if (state.phase === "entrance") return state;
      if (state.phase === "result") return { ...state, phase: "river" };
      const index = scenario.findIndex((scene) => scene.id === state.phase);
      return { ...state, phase: scenario[index - 1].id };
    }
  }
}
