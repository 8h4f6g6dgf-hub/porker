import { it, expect } from "vitest";
import { progressionReducer as step, cueCount, type Progression } from "../immersive/progression";
it("字幕をすべてたどり、最後だけ次章へ進む", () => {
 let s: Progression = { phase: "river", cue: 0, answer: null, revealed: [true,true] };
 expect(cueCount(s)).toBe(2);
 s = step(s, {type:"NEXT"}); expect(s.phase).toBe("river"); expect(s.cue).toBe(1);
 s = step(s, {type:"NEXT"}); expect(s.phase).toBe("quiz"); expect(s.cue).toBe(0);
 expect(step(s, {type:"ANSWER", answer:"2枚"})).toEqual(s);
 s = step(s, {type:"NEXT"}); expect(step(s, {type:"ANSWER", answer:"2枚"}).phase).toBe("result");
});
it("戻るは前字幕、章境界では前章の最終字幕", () => {
 let s: Progression = { phase:"river", cue:1, answer:null, revealed:[true,true] };
 s = step(s,{type:"BACK"}); expect(s.cue).toBe(0); expect(s.phase).toBe("river");
 s = step(s,{type:"BACK"}); expect(s.phase).toBe("turn"); expect(s.cue).toBe(cueCount(s)-1);
 s = step(s,{type:"NEXT"}); expect(s.phase).toBe("river"); expect(s.cue).toBe(0);
});
