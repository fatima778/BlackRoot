import { useEffect, useState } from "react";

const GLYPHS = "!<>-_\\/[]{}—=+*^?#01";

/**
 * On mount, briefly scrambles then resolves to the real text — the page's
 * one deliberate "breach" moment. Used only on primary headers, never
 * repeated per-element, so it reads as an event rather than decoration.
 */
export function GlitchText({ text, className = "" }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 10;
    const interval = setInterval(() => {
      frame += 1;
      if (frame >= totalFrames) {
        setDisplay(text);
        clearInterval(interval);
        return;
      }
      const revealCount = Math.floor((frame / totalFrames) * text.length);
      const scrambled = text
        .split("")
        .map((ch, i) => {
          if (ch === " ") return " ";
          if (i < revealCount) return ch;
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join("");
      setDisplay(scrambled);
    }, 40);
    return () => clearInterval(interval);
  }, [text]);

  return <span className={className}>{display}</span>;
}
