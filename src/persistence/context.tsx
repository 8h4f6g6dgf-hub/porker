import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { LearningData } from "../domain/types";
import { localRepository, emptyData } from "./storage";
interface Context {
  data: LearningData;
  update: (fn: (d: LearningData) => LearningData) => void;
  error: string;
  reset: () => void;
}
const LearningContext = createContext<Context | null>(null);
export function LearningProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    try {
      return { data: localRepository.load(), error: "" };
    } catch (e) {
      return {
        data: emptyData(),
        error: `保存データを読み込めません。既存データは上書きしません。${String(e)}`,
      };
    }
  });
  const [data, setData] = useState(initial.data),
    [error, setError] = useState(initial.error);
  const current = useRef(data);
  const update = useCallback(
    (fn: (d: LearningData) => LearningData) => {
      const next = fn(current.current);
      current.current = next;
      setData(next);
      if (!initial.error) {
        try {
          localRepository.save(next);
          setError("");
        } catch {
          setError(
            "保存できません。ブラウザのストレージ設定を確認してください。この画面の学習内容は一時的に保持しています。",
          );
        }
      }
    },
    [initial.error],
  );
  const reset = () => {
    try {
      localRepository.clear();
      location.reload();
    } catch {
      setError("保存データを削除できませんでした。");
    }
  };
  return (
    <LearningContext.Provider value={{ data, update, error, reset }}>
      {children}
    </LearningContext.Provider>
  );
}
export function useLearning() {
  const c = useContext(LearningContext);
  if (!c) throw new Error("LearningProvider required");
  return c;
}
