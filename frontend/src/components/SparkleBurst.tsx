import { motion } from "framer-motion";

const POSITIONS = [
  { top: "10%", left: "15%", delay: 0 },
  { top: "70%", left: "85%", delay: 0.15 },
  { top: "30%", left: "92%", delay: 0.3 },
  { top: "85%", left: "8%", delay: 0.45 },
  { top: "50%", left: "50%", delay: 0.2 },
];

/** Ambient sparkle particles layered over a panel — used only on unlock/reveal moments. */
export function SparkleBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {POSITIONS.map((p, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-mint shadow-glowSm"
          style={{ top: p.top, left: p.left }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.4] }}
          transition={{ duration: 1.6, delay: p.delay, repeat: Infinity, repeatDelay: 2.5 }}
        />
      ))}
    </div>
  );
}
