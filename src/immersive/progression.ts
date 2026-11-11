import { captionPages } from "./Captions";
import { initialIntroState, introReducer, sceneFor, resultLines, type IntroEvent, type IntroState } from "./scenario";
export type Progression = IntroState & { cue: number };
export const initialProgression = (): Progression => ({ ...initialIntroState(), cue: 0 });
export function cueCount(state: IntroState) {
  return captionPages(state.phase === "result" ? resultLines(state.answer) : sceneFor(state.phase).lines).length;
}
export function progressionReducer(state: Progression, event: IntroEvent): Progression {
  if (event.type === "NEXT" && state.cue < cueCount(state) - 1) return { ...state, cue: state.cue + 1 };
  if (event.type === "BACK" && state.cue > 0) return { ...state, cue: state.cue - 1 };
  if (event.type === "ANSWER" && state.cue < cueCount(state) - 1) return state;
  const next = introReducer(state, event);
  if (next.phase === state.phase && event.type !== "RESTART") return { ...next, cue: state.cue };
  return { ...next, cue: event.type === "BACK" ? Math.max(0, cueCount(next) - 1) : 0 };
}
