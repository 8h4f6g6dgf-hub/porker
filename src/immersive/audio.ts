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
            voice: v.voice,
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
  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      stop();
      if (!preferences.voice || !unlocked) {
        onEnd?.();
        return;
      }
      if (!supported) {
        setNotice(
          "このブラウザは音声合成に対応していません。字幕で進められます。",
        );
        onEnd?.();
        return;
      }
      const voice =
        voices.find((v) => v.voiceURI === preferences.voiceURI) ??
        voices.find((v) => /Otoya|Ichiro|Keita|男性/i.test(v.name)) ??
        voices[0];
      if (!voice) {
        setNotice("日本語の音声が見つかりません。字幕で進められます。");
        onEnd?.();
        return;
      }
      const id = generation.current;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.voice = voice;
      utterance.pitch = 0.82;
      utterance.rate = 0.9;
      utterance.volume = preferences.voiceVolume;
      completion.current = onEnd;
      setSpeaking(true);
      setNotice("");
      utterance.onend = () => {
        if (id !== generation.current) return;
        setSpeaking(false);
        completion.current?.();
        completion.current = undefined;
      };
      utterance.onerror = () => {
        if (id !== generation.current) return;
        setSpeaking(false);
        setNotice(
          "音声を再生できませんでした。再生ボタン、または字幕で進めてください。",
        );
        completion.current?.();
        completion.current = undefined;
      };
      speechSynthesis.speak(utterance);
    },
    [
      stop,
      preferences.voice,
      preferences.voiceVolume,
      preferences.voiceURI,
      unlocked,
      supported,
      voices,
    ],
  );
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
