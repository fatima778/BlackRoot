import { motion } from "framer-motion";

const READOUTS = [
  { top: "12%", left: "8%", value: "81.776", delay: 0 },
  { top: "22%", left: "88%", value: "34.137", delay: 0.6 },
  { top: "68%", left: "6%", value: "58.065", delay: 1.2 },
  { top: "78%", left: "92%", value: "13.995", delay: 0.3 },
  { top: "40%", left: "94%", value: "22.973", delay: 0.9 },
  { top: "85%", left: "45%", value: "90.348", delay: 1.5 },
  { top: "8%", left: "45%", value: "63.451", delay: 0.4 },
];

/** Purely decorative — mirrors the faint scattered readout numbers used as hero texture. */
export function FloatingReadouts() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden hidden md:block" aria-hidden="true">
      {READOUTS.map((r, i) => (
        <motion.span
          key={i}
          className="absolute font-mono text-[11px] text-jade/25 tracking-wider"
          style={{ top: r.top, left: r.left }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 5, delay: r.delay, repeat: Infinity, repeatDelay: 3 }}
        >
          {r.value}
        </motion.span>
      ))}
    </div>
  );
}
