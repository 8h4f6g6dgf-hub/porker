import { it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDealerAudio } from "../immersive/audio";
it("音声と効果音の音量を独立保持し、効果音変更で読み上げを再開始しない", () => {
  const cancel = vi.fn(),
    speak = vi.fn();
  vi.stubGlobal("speechSynthesis", {
    cancel,
    speak,
    getVoices: () => [{ name: "Japanese", lang: "ja-JP", voiceURI: "ja-test" }],
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      text: string;
      constructor(t: string) {
        this.text = t;
      }
    },
  );
  try {
    const { result, unmount } = renderHook(() => useDealerAudio());
    act(() => {
      result.current.unlock();
      result.current.setPreferences((p) => ({
        ...p,
        voice: true,
        voiceVolume: 0,
      }));
    });
    act(() => result.current.speak("ようこそ"));
    expect(speak).toHaveBeenCalledTimes(1);
    expect(speak.mock.calls[0][0].volume).toBe(0);
    const fn = result.current.speak;
    act(() =>
      result.current.setPreferences((p) => ({ ...p, effectsVolume: 0.1 })),
    );
    expect(result.current.speak).toBe(fn);
    unmount();
    expect(cancel).toHaveBeenCalled();
    const second = renderHook(() => useDealerAudio());
    expect(second.result.current.preferences.voiceVolume).toBe(0);
    second.unmount();
  } finally {
    vi.unstubAllGlobals();
  }
});
