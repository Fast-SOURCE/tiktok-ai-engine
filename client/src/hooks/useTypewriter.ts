import { useEffect, useRef, useState } from "react";

/**
 * Reveal characters of `text` over time to mimic an LLM streaming response.
 * - speed: ms per character (lower = faster)
 * - autoStart: starts immediately when text changes; otherwise wait for `start()`
 */
export function useTypewriter(text: string, speed = 18, autoStart = true) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  const [running, setRunning] = useState(autoStart);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setShown("");
    setDone(false);
    indexRef.current = 0;
    if (autoStart) {
      setRunning(true);
    } else {
      setRunning(false);
    }
  }, [text, autoStart]);

  useEffect(() => {
    if (!running || !text) return;
    timerRef.current = setInterval(() => {
      indexRef.current += 1;
      const next = text.slice(0, indexRef.current);
      setShown(next);
      if (indexRef.current >= text.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setDone(true);
        setRunning(false);
      }
    }, speed);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, text, speed]);

  return {
    shown,
    done,
    running,
    start: () => setRunning(true),
    reset: () => {
      indexRef.current = 0;
      setShown("");
      setDone(false);
    },
  };
}
