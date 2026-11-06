import type {
  Lesson,
  QuizQuestion,
  PokerTableState,
  LessonStep,
} from "../domain/types";
import { cards } from "../domain/poker";
export const sampleTable: PokerTableState = {
  hole: cards("Ah Kh"),
  board: cards("Qh Jh Th 2c 7d"),
  pot: 150,
  label: "7枚から、最も強い5枚を。",
};
type QInput = [
  string,
  string[],
  string,
  string,
  string?,
  QuizQuestion["kind"]?,
  PokerTableState?,
];
interface Seed {
  title: string;
  topic: string;
  description: string;
  learn: string[];
  text: string;
  interaction: NonNullable<LessonStep["interaction"]>;
  task: string;
  table?: PokerTableState;
  sourceIds: string[];
  questions: QInput[];
}
const seeds: Seed[] = [
  {
    title: "ポーカーとは？",
    topic: "基本ルール",
    description: "2枚の手札から始まる、新しい世界。",
    learn: ["2つの勝ち方を知る", "7枚から5枚を選ぶ"],
    text: "テキサスホールデムは、自分だけの手札2枚と、全員が使える共通カード5枚で競うゲームです。最後まで残った人が手札を見せ合う「ショーダウン」では、7枚の中の最強の5枚で勝敗を決めます。手札は0枚・1枚・2枚のどの使い方でも構いません。もう1つの勝ち方は、他の全員がFold（その勝負から降りる）すること。集まったチップを「ポット」と呼び、勝者が受け取ります。",
    interaction: "select-five",
    task: "カードをタップして5枚を選び、できた役を確認しましょう。♥のA・K・Q・J・10が最も強い組合せです。",
    sourceIds: ["holdem"],
    questions: [
      [
        "自分だけに配られる手札は何枚？",
        ["1枚", "2枚", "5枚", "7枚"],
        "2枚",
        "手札は2枚。共通カード5枚と合わせて7枚を利用できます。",
        "7枚すべてが自分だけのカードではありません。",
      ],
      [
        "ショーダウンで比べる役は何枚で作る？",
        ["2枚", "5枚", "6枚", "7枚"],
        "5枚",
        "常に最も強い5枚を比較します。残った2枚は勝敗に使いません。",
      ],
      [
        "自分以外の全員がFoldしたら、役が弱くても勝てる？",
        ["勝てる", "勝てない"],
        "勝てる",
        "最後の1人になれば、役を比較せずにポットを獲得します。",
        undefined,
        "binary",
      ],
    ],
  },
  {
    title: "ポーカーの役",
    topic: "役判定",
    description: "カードの組合せに、強さの順序を。",
    learn: ["9段階の役を知る", "実際のカードで役を見分ける"],
    text: "弱い順に、ハイカード（役なし）、ワンペア（同じランク2枚）、ツーペア（ペア2組）、スリーカード（同じランク3枚）、ストレート（連番5枚）、フラッシュ（同じスート5枚）、フルハウス（3枚組＋ペア）、フォーカード（同じランク4枚）、ストレートフラッシュ（同じスートの連番5枚）。ロイヤルフラッシュは同じスートの10・J・Q・K・Aで、ストレートフラッシュの最高形です。スートとは♠♥♦♣のマーク。AはA2345の最小ストレートにも使えますが、QKA23のように途中で折り返せません。",
    interaction: "select-five",
    task: "7枚から5枚を選択。選び方で役がどう変わるか確かめましょう。",
    sourceIds: ["holdem"],
    questions: [
      [
        "表示された5枚の役は？",
        ["ワンペア", "ツーペア", "スリーカード", "フルハウス"],
        "ツーペア",
        "Aが2枚、Kが2枚あるためツーペアです。",
        "3枚組がないのでフルハウスではありません。",
        "hand",
        { hole: [], board: cards("As Ad Kc Kh 2s") },
      ],
      [
        "フラッシュとフルハウスでは、どちらが強い？",
        ["フラッシュ", "フルハウス"],
        "フルハウス",
        "フルハウスはフラッシュより上位です。",
        undefined,
        "binary",
      ],
      [
        "♥10・J・Q・K・Aはどの役の最高形？",
        ["ストレートフラッシュ", "フォーカード", "フルハウス", "ワンペア"],
        "ストレートフラッシュ",
        "ロイヤルフラッシュはAを最高位とするストレートフラッシュです。",
      ],
    ],
  },
  {
    title: "カードの強さと勝敗",
    topic: "役判定",
    description: "同じ役。その勝敗を分ける一枚。",
    learn: ["キッカーを比較する", "引き分けと分配を知る"],
    text: "通常のランクは2が最小、Aが最大で、2〜10・J・Q・K・Aの順です。同じ役なら役を構成するランクを先に比較し、それも同じなら残りのカード「キッカー」を高い順に比較します。例：Aのペア同士で、残りがK・9・4ならQ・9・4より上。最強の5枚が同じなら引き分けで、対象のポットを分けます。6枚目・7枚目やスートの違いで優劣はつきません。",
    interaction: "flip",
    task: "手札をタップして表裏を切り替え、共通カードだけで最強の役ができる例を確認しましょう。",
    table: {
      hole: cards("2c 3d"),
      board: cards("As Ks Qs Js Ts"),
      opponent: cards("Ah Ad"),
    },
    sourceIds: ["holdem", "tda"],
    questions: [
      [
        "Aのペア同士。A A K 9 4 と A A Q 9 4 の勝者は？",
        ["Kを持つ側", "Qを持つ側", "引き分け", "スートで決める"],
        "Kを持つ側",
        "ペアが同じなので最初のキッカーを比較し、KがQに勝ちます。",
        undefined,
        "compare",
      ],
      [
        "共通カードが♠A K Q J 10。手札が2♣3♦とA♥A♦なら？",
        ["2♣3♦の勝ち", "A♥A♦の勝ち", "引き分け", "配り直し"],
        "引き分け",
        "両者とも共通カードのロイヤルフラッシュが最強の5枚です。",
        "余った手札のAは比較しません。",
        "compare",
        {
          hole: cards("2c 3d"),
          board: cards("As Ks Qs Js Ts"),
          opponent: cards("Ah Ad"),
        },
      ],
      [
        "100チップのポットを2人で同じ権利で引き分け。各自の取り分は？",
        [],
        "50",
        "100÷2=50チップです。レーキなし・端数なしの例です。",
        undefined,
        "number",
      ],
    ],
  },
  {
    title: "ゲームの進行",
    topic: "ゲーム進行",
    description: "プリフロップから、最後の一枚まで。",
    learn: ["5つの段階を順に覚える", "共通カードの枚数を理解する"],
    text: "プリフロップは手札2枚だけで行う最初のベットラウンドです。フロップでは共通カードを一度に3枚公開。ターンで4枚目、リバーで5枚目を公開し、それぞれでベットを行います。最後のベットが終わり複数人が残れば、ショーダウンで役を比較します。途中で全員が1人を除きFoldした場合はその時点で終了。全員のオールインなど追加のベットができない場合は、必要な共通カードを開いて比較します。",
    interaction: "deal",
    task: "「次のラウンド」でカードを順番に配りましょう。左右のスワイプでも段階を変更できます。",
    sourceIds: ["holdem"],
    questions: [
      [
        "フロップで最初に公開する共通カードは？",
        ["1枚", "2枚", "3枚", "5枚"],
        "3枚",
        "フロップは3枚を一度に公開する段階です。",
      ],
      [
        "ターンの次に来る段階は？",
        ["プリフロップ", "フロップ", "リバー", "新しい手札"],
        "リバー",
        "ターンは4枚目、リバーは5枚目を公開します。",
      ],
      [
        "リバーのベット終了後、複数人が残っていたら？",
        ["ショーダウン", "必ず引き分け", "6枚目を配る", "ブラインドを倍にする"],
        "ショーダウン",
        "残ったプレイヤーの最強の5枚を比較します。",
      ],
    ],
  },
  {
    title: "プレイヤーのアクション",
    topic: "アクション",
    description: "一手の意味がわかれば、卓が読める。",
    learn: ["6つのアクションを知る", "CheckとCallを使い分ける"],
    text: "Foldは降りること。Checkは追加チップを出さずに手番を渡すこと（未払いのコール額がない場合）。Callは現在のベット額との差額を支払うこと。Betはそのラウンドで最初に賭けること。Raiseは既存のベットを上乗せすること。All-inは手持ちの全チップを出すことです。All-inがCallになるかBet/Raiseになるかは金額次第。不足したCallでもその人が出した分に応じたポットには参加できますが、すべてのポットを取れるとは限りません。",
    interaction: "chips",
    task: "練習用のチップをポットへ移動して、チップを出す操作を体験しましょう。これは対戦のベットではありません。",
    sourceIds: ["holdem", "tda"],
    questions: [
      [
        "フロップ。誰もベットしていない。追加チップなしで続けるには？",
        ["Check", "Call", "Raise", "Fold"],
        "Check",
        "未払いのベットがないのでCheckで次の人に手番を渡せます。",
        undefined,
        "action",
      ],
      [
        "相手が50をBet。自分はこのラウンドで0を投入済み。同額に合わせるには？",
        ["Check", "Call 50", "Bet 25", "Raise 50まで"],
        "Call 50",
        "Callは相手のベットに合わせる操作で、この例では差額50です。",
        "ベットに直面してCheckはできません。",
        "action",
      ],
      [
        "All-inの意味は？",
        [
          "ポットの半分を出す",
          "手持ちをすべて出す",
          "必ず勝てる",
          "必ずRaiseになる",
        ],
        "手持ちをすべて出す",
        "手持ち全部を投入します。金額によってCallにもBet/Raiseにもなります。",
      ],
    ],
  },
  {
    title: "ブラインドとポジション",
    topic: "ポジション",
    description: "座る場所が、情報の量を変える。",
    learn: ["6人卓の席順を知る", "行動順とボタンを理解する"],
    text: "ディーラーボタン（BTN）は配り役の位置を示す印です。6人卓で時計回りにBTN→SB→BB→UTG→HJ→CO。SB（スモールブラインド）とBB（ビッグブラインド）は手札を見る前に出す強制ベットです。プリフロップはBBの次のUTGから。フロップ以降はBTNの次の、まだ参加していて行動できる人から始まります。COはBTNの直前、HJはその前の席。後から行動するほど他の人の行動を見られますが、良い結果を保証するものではありません。2人卓の順序はこの6人卓の例とは異なります。",
    interaction: "button",
    task: "ボタンを時計回りに動かすと、SB・BB・UTGの位置も移ります。6人全員が着席している例です。",
    table: { hole: [], board: [], seats: true, dealer: 0 },
    sourceIds: ["holdem", "context"],
    questions: [
      [
        "6人卓のプリフロップで最初に行動するのは？",
        ["BTN", "SB", "BB", "UTG"],
        "UTG",
        "BBの左隣（時計回りの次）のUTGから始めます。",
      ],
      [
        "6人全員が残ったフロップで最初に行動するのは？",
        ["BTN", "SB", "CO", "UTG"],
        "SB",
        "BTNの時計回りの次にいるSBが最初です。Fold済み・オールイン済みなら飛ばします。",
      ],
      [
        "BTNの直後の2席が出す強制ベットは？",
        ["SBとBB", "UTGとCO", "BetとRaise", "KとA"],
        "SBとBB",
        "SBとBBは勝負開始時にポットを作る強制ベットです。",
      ],
    ],
  },
  {
    title: "ベットとポット",
    topic: "ベット計算",
    description: "チップの動きを、数字で理解する。",
    learn: ["差額のCallを計算する", "Raiseの合計額と増額を区別する"],
    text: "ポットはプレイヤーが出したチップの合計です。Call額は「現在の最高投入額−自分のそのラウンドの投入済み額」。例：最高100、自分40なら追加60です。「300までRaise」は合計投入額が300になる意味で、300を追加する意味ではありません。通常の最小レイズ増額は直前の完全なBet/Raise増額以上。100から300へのRaiseの増額は200なので、次は少なくとも500までです。少額のAll-inや再レイズ権には例外があり、この例は十分な持ちチップがある場合です。",
    interaction: "chips",
    task: "25チップずつ加え、ポットの合計が増えることを確かめましょう。戻すボタンは学習用です。",
    table: { hole: cards("As Kd"), board: cards("Qc Jh 2s"), pot: 100 },
    sourceIds: ["holdem", "tda", "math"],
    questions: [
      [
        "相手の合計100、自分は40投入済み。追加のCall額は？",
        [],
        "60",
        "100−40=60。すでに出した40を二重に払いません。",
        undefined,
        "number",
      ],
      [
        "ポット150に、2人が50ずつ追加。新しいポットは？",
        [],
        "250",
        "150+50+50=250。レーキや払い戻しがない例です。",
        undefined,
        "number",
      ],
      [
        "100から300へ完全なRaise。十分なチップがある次の人の最小Raise合計額は？",
        [],
        "500",
        "増額は300−100=200。次は300+200=500までが最小です。",
        "300の倍の600とは限りません。",
        "number",
      ],
    ],
  },
  {
    title: "スターティングハンド",
    topic: "スターティングハンド",
    description: "最初の2枚を、正しく読み解く。",
    learn: [
      "ペア・スーテッド・オフスートを分類する",
      "169種類の意味を理解する",
    ],
    text: "最初の2枚をスターティングハンドと呼びます。同じランクならポケットペア（AAなど）。異なるランクで同じスートならスーテッド（AKs）、異なるスートならオフスート（AKo）です。ランクと同一スートかどうかでまとめると、ペア13種類＋スーテッド78種類＋オフスート78種類＝169種類。実際のカードの組合せは52×51÷2＝1,326通りです。AAは強い出発点ですが、勝利は確定しません。参加するかはポジション、相手の行動、人数、残りチップなどによって変わり、この教材では固定の参加レンジを断定しません。",
    interaction: "flip",
    task: "手札をめくって、A♥K♥が同じスートであることを確認しましょう。",
    table: { hole: cards("Ah Kh"), board: [] },
    sourceIds: ["holdem", "math", "context"],
    questions: [
      [
        "A♥K♥の分類は？",
        ["ポケットペア", "スーテッド", "オフスート", "フォーカード"],
        "スーテッド",
        "異なるランクで同じ♥なのでAKsです。",
      ],
      [
        "ランクとスーテッド／オフスートでまとめた初手の種類数は？",
        [],
        "169",
        "13+78+78=169種類。実際のカードの組合せ1,326通りとは異なります。",
        undefined,
        "number",
      ],
      [
        "AAを配られたら勝利が確定する？",
        ["確定する", "確定しない"],
        "確定しない",
        "共通カードと相手の手札によって負ける可能性があります。",
        "強い初手と必ず勝つ手は違います。",
        "binary",
      ],
    ],
  },
  {
    title: "確率の基礎",
    topic: "確率",
    description: "あと一枚。その可能性を数える。",
    learn: ["アウツを数える", "ドロー完成率と勝率を区別する"],
    text: "あと特定のカードで役が完成する状態を「ドロー」、その完成に役立つ未見カードを「アウツ」と呼びます。フロップで自分の手札と共通カードに♥が4枚あるなら、残りの♥は13−4＝9枚。未見47枚から次の1枚で♥を引く確率は9/47≒19.15%。リバーまで2枚見られるなら1−(38/47)×(37/46)≒34.97%です。5・6・7・8の両端待ちストレートは4と9で通常8アウツ。役が完成しても上位の役に負ける場合があるので、この確率をそのまま勝率にはできません。",
    interaction: "deal",
    task: "フロップの♥は合計4枚。ターン・リバーを開く前に、残りの♥を数えましょう。配布は説明用の固定例で、乱数シミュレーションではありません。",
    table: { hole: cards("Ah Kh"), board: cards("Qh 7h 2c 3s 9d") },
    sourceIds: ["math"],
    questions: [
      [
        "フロップで既知の♥が4枚。他のカードの情報なし。残りの♥は？",
        [],
        "9",
        "同じスートは13枚なので13−4=9枚です。",
        undefined,
        "number",
      ],
      [
        "9アウツ・未見47枚。次の1枚で完成する確率に最も近いのは？",
        ["約9%", "約19%", "約35%", "約50%"],
        "約19%",
        "9÷47×100≒19.15%。約35%は2枚見られるときの値です。",
      ],
      [
        "フラッシュが完成する確率と、相手に勝つ確率は必ず同じ？",
        ["同じ", "異なる場合がある"],
        "異なる場合がある",
        "完成しても相手のフルハウスなどに負けることがあります。",
        undefined,
        "binary",
      ],
    ],
  },
  {
    title: "ポットオッズ入門",
    topic: "ポットオッズ",
    description: "コールの値段を、期待値で考える。",
    learn: ["必要勝率を計算する", "単純化した期待値を読む"],
    text: "ポットオッズはCallの費用と得られるポットの関係です。相手のBetを含む現在のポットをP、Call額をCとすると、必要勝率はC/(P+C)。元のポット100に相手が50をBetするとP=150、C=50なので必要勝率は25%です。追加ベットなし・レーキなし・引き分けなしの1対1で、Callの期待値は勝率×P−負ける確率×C。勝率30%なら0.30×150−0.70×50=+10。これは多数回の平均の考え方で、1回の勝利を保証しません。将来のベットがある場面ではこの式だけで判断できません。",
    interaction: "chips",
    task: "ポット150にCall 50を加えると合計200。そのうち自分が払う50は25%です。25チップを2回加えて確認しましょう。",
    table: { hole: cards("As Qd"), board: cards("Ac 7h 2s 3d 9c"), pot: 150 },
    sourceIds: ["math"],
    questions: [
      [
        "元ポット100、相手が50をBet、Call額50。必要勝率は何%？",
        [],
        "25",
        "50/(100+50+50)×100=25%。相手のBetを忘れずに含めます。",
        "現在ポット150にCall額50を足します。",
        "number",
      ],
      [
        "現在ポット200（相手Bet込み）、Call額100。必要勝率は？",
        ["25%", "約33.3%", "50%", "約66.7%"],
        "約33.3%",
        "100/(200+100)=1/3。追加ベット・レーキ・引き分けなしの例です。",
      ],
      [
        "現在ポット150・Call50・勝率30%。追加ベット、レーキ、引き分けなし。Callの期待値は？",
        ["+10", "−10", "0", "+50"],
        "+10",
        "0.30×150−0.70×50=10チップ。Foldを0とした差分の期待値です。",
      ],
    ],
  },
];
export const lessons: Lesson[] = seeds.map((s, i) => {
  const id = `lesson-${String(i + 1).padStart(2, "0")}`;
  const table = s.table ?? sampleTable;
  return {
    id,
    version: "1.0.0",
    title: s.title,
    description: s.description,
    difficulty: "beginner",
    estimatedMinutes: 6,
    learningObjectives: s.learn,
    prerequisites: i ? [`lesson-${String(i).padStart(2, "0")}`] : [],
    topic: s.topic,
    sourceIds: s.sourceIds,
    verificationStatus: s.sourceIds.includes("context")
      ? "CONTEXT_DEPENDENT"
      : "VERIFIED",
    publicationStatus: "published",
    updatedAt: "2026-11-05",
    steps: [
      {
        id: `${id}-intro`,
        type: "explanation",
        content: s.text,
        sourceIds: s.sourceIds,
        tableState: table,
      },
      {
        id: `${id}-practice`,
        type: "interaction",
        content: s.task,
        sourceIds: s.sourceIds,
        tableState: table,
        interaction: s.interaction,
      },
      ...s.questions.map((q, j): LessonStep => ({
        id: `${id}-quiz-${j + 1}`,
        type: "quiz",
        content: q[0],
        sourceIds: s.sourceIds,
        tableState: q[6] ?? table,
        question: {
          id: `${id}-q${j + 1}`,
          kind: q[5] ?? "choice",
          prompt: q[0],
          situation:
            i === 9
              ? "追加ベット・レーキ・引き分けなしの1対1。チップは学習用です。"
              : "このレッスンで説明したテキサスホールデムの条件で考えてください。",
          options: q[1].length ? q[1] : undefined,
          answer: q[2],
          explanation: q[3],
          pitfall: q[4] ?? "言葉の意味と、いま比べる対象を確認しましょう。",
          related: s.learn.join("／"),
          sourceIds: s.sourceIds,
          difficulty: "beginner",
          topic: s.topic,
          version: "1.0.0",
          tableState: q[6] ?? table,
        },
      })),
    ],
  };
});
export const publishedLessons = lessons.filter(
  (l) =>
    l.publicationStatus === "published" &&
    l.verificationStatus !== "UNVERIFIED",
);
export const curriculumChanges = lessons.map((l) => ({
  updatedAt: "2026-11-05",
  lessonId: l.id,
  oldVersion: null,
  newVersion: l.version,
  type: "教材追加",
  description: "解説・テーブル操作・理解度確認3問を新設",
  reason: "初心者向けVersion 0.1の初回教材",
  sourceIds: l.sourceIds,
}));
