import { motion } from "motion/react";
import type { Card, PokerTableState } from "../domain/types";
import { rankLabel, symbols } from "../domain/poker";
export function PlayingCard({
  card,
  back = false,
  selected = false,
  onClick,
  delay = 0,
}: {
  card?: Card;
  back?: boolean;
  selected?: boolean;
  onClick?: () => void;
  delay?: number;
}) {
  const label = card
    ? `${rankLabel(card.rank)}${symbols[card.suit]}`
    : "カードの裏";
  const content =
    back || !card ? (
      <span className="card-emblem">♠</span>
    ) : (
      <>
        <span className="card-corner">
          {rankLabel(card.rank)}
          <small>{symbols[card.suit]}</small>
        </span>
        <span className="card-suit">{symbols[card.suit]}</span>
        <span className="card-corner bottom">
          {rankLabel(card.rank)}
          <small>{symbols[card.suit]}</small>
        </span>
      </>
    );
  return (
    <motion.button
      key={back ? "back" : "front"}
      type="button"
      disabled={!onClick}
      aria-label={back ? "裏向きの手札" : label}
      aria-pressed={onClick ? selected : undefined}
      onClick={onClick}
      initial={{ opacity: 0, y: -25, rotateY: 90 }}
      animate={{ opacity: 1, y: selected ? -12 : 0, rotateY: 0 }}
      transition={{ duration: 0.28, delay }}
      className={`playing-card ${back || !card ? "back" : ""} ${card && ["h", "d"].includes(card.suit) ? "red" : ""} ${selected ? "selected" : ""}`}
    >
      {content}
    </motion.button>
  );
}
export function CardDeck() {
  return (
    <div className="deck" aria-label="山札">
      <PlayingCard back />
    </div>
  );
}
export function PokerChip({ value = 25 }: { value?: number }) {
  return (
    <span className={`chip chip-${value}`} aria-label={`${value}チップ`}>
      {value}
    </span>
  );
}
export function ChipStack({ amount }: { amount: number }) {
  let rest = amount;
  const groups = [100, 25, 5, 1]
    .map((value) => {
      const count = Math.floor(rest / value);
      rest %= value;
      return { value, count };
    })
    .filter((g) => g.count > 0);
  return (
    <div
      className="chip-stack"
      style={{ width: Math.max(1, groups.length) * 30 }}
      aria-label={`合計${amount}チップ`}
    >
      {groups.flatMap((g, col) =>
        Array.from({ length: g.count }, (_, i) => (
          <span
            key={`${g.value}-${i}`}
            style={{ transform: `translate(${col * 30}px,${-i * 4}px)` }}
          >
            <PokerChip value={g.value} />
          </span>
        )),
      )}
    </div>
  );
}
export function DealerButton() {
  return (
    <span className="dealer" aria-label="ディーラーボタン">
      D
    </span>
  );
}
export function PlayerSeat({
  index,
  dealer = 0,
}: {
  index: number;
  dealer?: number;
}) {
  const role = ["BTN", "SB", "BB", "UTG", "HJ", "CO"][(index - dealer + 6) % 6];
  return (
    <div className={`seat seat-${index}`}>
      <span className="seat-avatar">{index === 0 ? "♙" : "♟"}</span>
      <span>
        {index === 0 ? "YOU" : `SEAT ${index + 1}`} <b>{role}</b>
      </span>
      {index === dealer && <DealerButton />}
    </div>
  );
}
export function CommunityCards({
  cards,
  select,
  selected = [],
  count = 5,
}: {
  cards: Card[];
  select?: (c: Card) => void;
  selected?: string[];
  count?: number;
}) {
  return (
    <div className="community">
      {Array.from({ length: 5 }, (_, i) =>
        cards[i] && i < count ? (
          <PlayingCard
            key={`${cards[i].rank}${cards[i].suit}`}
            card={cards[i]}
            onClick={select ? () => select(cards[i]) : undefined}
            selected={selected.includes(`${cards[i].rank}${cards[i].suit}`)}
            delay={i * 0.055}
          />
        ) : (
          <div key={i} className="card-slot">
            {i === 3 ? "TURN" : i === 4 ? "RIVER" : "FLOP"}
          </div>
        ),
      )}
    </div>
  );
}
export function PokerTable({
  state,
  select,
  selected = [],
  reveal = 5,
  flipped = false,
  flip,
}: {
  state: PokerTableState;
  select?: (c: Card) => void;
  selected?: string[];
  reveal?: number;
  flipped?: boolean;
  flip?: () => void;
}) {
  return (
    <div className={`table-scene ${state.seats ? "with-seats" : ""}`}>
      <div className="table-light" />
      <div className="poker-table">
        <div className="table-inner">
          <div className="table-brand">
            PA <span>POKER ACADEMY</span>
          </div>
          <div className="pot-label">
            POT <strong>{state.pot ?? 150}</strong>
            <ChipStack amount={state.pot ?? 150} />
          </div>
          <CommunityCards
            cards={state.board}
            count={reveal}
            select={select}
            selected={selected}
          />
          <div className="felt-caption">NO LIMIT TEXAS HOLD’EM</div>
        </div>
      </div>
      <div className="hole-area">
        <div className="hole-cards">
          {state.hole.map((c, i) => (
            <PlayingCard
              key={c.rank + c.suit}
              card={c}
              back={flipped}
              onClick={flip ?? (select ? () => select(c) : undefined)}
              selected={selected.includes(c.rank + c.suit)}
              delay={0.1 * i}
            />
          ))}
        </div>
        {state.hole.length > 0 && (
          <span className="hand-label">あなたの手札</span>
        )}
      </div>
      {state.opponent && (
        <div className="opponent">
          <span>比較する相手の手札</span>
          {state.opponent.map((c) => (
            <PlayingCard key={c.rank + c.suit} card={c} />
          ))}
        </div>
      )}
      <div className="table-deck">
        <CardDeck />
      </div>
      {state.seats &&
        Array.from({ length: 6 }, (_, i) => (
          <PlayerSeat key={i} index={i} dealer={state.dealer} />
        ))}
    </div>
  );
}
