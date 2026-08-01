import { useState } from "react";
import { motion } from "framer-motion";
import { SparkleBurst } from "./SparkleBurst";

export function RecoveryCodeReveal({ code, onContinue }: { code: string; onContinue: () => void }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — the code is still selectable text, so
      // the user can still copy it manually.
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="panel relative p-6 overflow-hidden border-2 border-jade/50"
    >
      <SparkleBurst />
      <p className="text-xs font-mono text-signal tracking-widest mb-2">⚠ SHOWN ONCE — SAVE THIS NOW</p>
      <h2 className="font-display text-base text-jade text-glow mb-3">YOUR RECOVERY CODE</h2>
      <p className="text-xs text-muted font-mono leading-relaxed mb-4">
        There's no email or SMS on this network to send you a reset link — this code <em>is</em> your password
        reset mechanism. If you lose it and forget your password, only a Sysadmin can restore access. Store it
        somewhere safe before continuing.
      </p>
      <div className="bg-void border border-jade/40 rounded-sm px-4 py-3 mb-4 flex items-center justify-between gap-3">
        <code className="font-display text-jade text-glow text-sm md:text-base tracking-[0.15em] select-all">
          {code}
        </code>
        <button
          onClick={handleCopy}
          className="shrink-0 text-[11px] font-mono text-muted hover:text-jade border border-hairline hover:border-jade/50 rounded-sm px-2.5 py-1.5 transition-colors"
        >
          {copied ? "copied ✓" : "copy"}
        </button>
      </div>
      <button onClick={onContinue} className="btn-primary w-full">
        I've saved it — continue
      </button>
    </motion.div>
  );
}
