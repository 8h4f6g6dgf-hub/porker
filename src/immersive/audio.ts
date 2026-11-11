import { useCallback, useEffect, useRef, useState } from "react";
export interface AudioPreferences {
  voice: boolean;
  voiceVolume: number;
  effectsVolume: number;
  voiceURI: string;
}
export const audioDefaults: AudioPreferences = {
  voice: false,
  voiceVolume: 0.8,
  effectsVolume: 0.35,
  voiceURI: "",
};
export function useDealerAudio() {
  const [preferences, setPreferences] = useState<AudioPreferences>(() => {
    try {
      const v = JSON.parse(
        localStorage.getItem("poker-academy.audio.v2") ?? "null",
      );
      return v && typeof v.voice === "boolean"
        ? {
            voice: false,
            voiceVolume: Math.max(
              0,
              Math.min(1, Number.isFinite(v.voiceVolume) ? v.voiceVolume : 0.8),
            ),
            effectsVolume: Math.max(
              0,
              Math.min(1, Number(v.effectsVolume) || 0),
            ),
            voiceURI: typeof v.voiceURI === "string" ? v.voiceURI : "",
          }
        : audioDefaults;
    } catch {
      return audioDefaults;
    }
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]),
    [speaking, setSpeaking] = useState(false),
    [notice, setNotice] = useState(""),
    [unlocked, setUnlocked] = useState(false);
  const audioContext = useRef<AudioContext | null>(null),
    generation = useRef(0),
    completion = useRef<(() => void) | undefined>(undefined);
  const supported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;
  useEffect(() => {
    if (!supported) return;
    const refresh = () =>
      setVoices(
        speechSynthesis
          .getVoices()
          .filter((v) => v.lang.toLowerCase().startsWith("ja")),
      );
    refresh();
    speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => speechSynthesis.removeEventListener("voiceschanged", refresh);
  }, [supported]);
  useEffect(() => {
    try {
      localStorage.setItem(
        "poker-academy.audio.v2",
        JSON.stringify(preferences),
      );
    } catch {
      setNotice("音声設定を保存できません。このタブでは変更を保持しています。");
    }
  }, [preferences]);
  const stop = useCallback(() => {
    generation.current++;
    completion.current = undefined;
    if (supported) speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);
  const unlock = useCallback(() => {
    setUnlocked(true);
    try {
      audioContext.current ??= new AudioContext();
      void audioContext.current.resume().catch(() => {});
    } catch {
      /* Optional sound effects. */
    }
  }, []);
  // No browser TTS: voice quality cannot be guaranteed across devices.
  const speak = useCallback((_text: string, onEnd?: () => void) => {
    stop();
    onEnd?.();
  }, [stop]);
  const effect = useCallback(
    (kind: "card" | "answer" = "card") => {
      const ctx = audioContext.current;
      if (!ctx || ctx.state !== "running" || preferences.effectsVolume === 0)
        return;
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        preferences.effectsVolume * 0.08,
        ctx.currentTime + 0.015,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      if (kind === "card") {
        const buffer = ctx.createBuffer(
          1,
          ctx.sampleRate * 0.15,
          ctx.sampleRate,
        );
        const a = buffer.getChannelData(0);
        for (let i = 0; i < a.length; i++)
          a[i] = (Math.random() * 2 - 1) * (1 - i / a.length);
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1800;
        noise.connect(filter);
        filter.connect(gain);
        noise.start();
        noise.onended = () => {
          noise.disconnect();
          filter.disconnect();
          gain.disconnect();
        };
      } else {
        const tone = ctx.createOscillator();
        tone.frequency.value = 392;
        tone.connect(gain);
        tone.start();
        tone.stop(ctx.currentTime + 0.18);
        tone.onended = () => {
          tone.disconnect();
          gain.disconnect();
        };
      }
    },
    [preferences.effectsVolume],
  );
  useEffect(
    () => () => {
      generation.current++;
      if (supported) speechSynthesis.cancel();
      void audioContext.current?.close();
    },
    [supported],
  );
  return {
    preferences,
    setPreferences,
    voices,
    speaking,
    notice,
    supported,
    unlocked,
    unlock,
    speak,
    stop,
    effect,
  };
}
