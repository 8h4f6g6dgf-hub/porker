import type { SourceReference } from "../domain/types";
export const sources: SourceReference[] = [
  {
    id: "holdem",
    title: "PokerStars — How to Play Texas Hold’em",
    category: "RULE",
    url: "https://www.pokerstars.com/poker/games/texas-holdem/",
    section:
      "The Rules / The Blinds / Player Betting Options / Pre-Flop〜Showdown / Hand ranks",
    accessedAt: "2026-11-05",
    verificationStatus: "VERIFIED",
    verificationNotes:
      "本文を閲覧し、手札・共通カード・進行・アクション・役の順位を照合。日本語の説明と例題は本アプリ独自に作成。",
    caveat:
      "No-Limit Texas Hold’emを対象とします。大会や施設独自のルールは別途確認してください。",
  },
  {
    id: "tda",
    title: "Poker TDA — 2026 Rules, Version 1.1",
    category: "RULE",
    url: "https://www.pokertda.com/view-poker-tda-rules/",
    section:
      "Rules 13–23（ショーダウン・分配）、45（レイズ額）、49（ベットの再開）",
    accessedAt: "2026-11-05",
    verificationStatus: "VERIFIED",
    verificationNotes:
      "公開本文を閲覧。役の判定・ボード使用・ポット分配とベットの例外を参照。",
    caveat:
      "トーナメント向け規則です。端数チップは完全な等分にならない場合があります。ショートオールインは通常の最小レイズの例外です。",
  },
  {
    id: "math",
    title: "独立計算 — 組合せ・確率・チップ収支",
    category: "MATH",
    section: "src/domain/poker.ts / src/tests/domain.test.ts",
    verificationStatus: "VERIFIED",
    verificationNotes:
      "アウツ確率は非復元抽出の余事象、必要勝率はコールの期待値=0から導出。組合せ数・具体値を自動テストで検証。",
    caveat:
      "ドロー完成確率は勝率ではありません。必要勝率の例は追加ベットなし・レーキなし・引き分けなし・ヘッズアップを仮定します。",
  },
  {
    id: "context",
    title: "PokerStars — Starting hands（条件付きの学習指針）",
    category: "STRATEGY",
    url: "https://www.pokerstars.com/poker/games/texas-holdem/",
    section: "How many Hand Combinations / starting hands・position",
    accessedAt: "2026-11-05",
    verificationStatus: "CONTEXT_DEPENDENT",
    verificationNotes:
      "ポジションや参加人数により判断が変わることを確認。固定の参加レンジやソルバーの最適解は掲載していません。",
    caveat:
      "相手、人数、スタック、ベット額で推奨は変わります。利益や勝利を保証するものではありません。",
  },
];
