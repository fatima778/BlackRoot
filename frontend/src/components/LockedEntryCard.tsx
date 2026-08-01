import { Role } from "../api/client";
import { RoleBadge } from "./RoleBadge";

function glyphLine(length: number): string {
  const chars = "▓▒░#%&";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function LockedEntryCard({ requiredClearance }: { requiredClearance: Role }) {
  return (
    <div className="panel relative p-4 opacity-80">
      <div className="flex items-center justify-between mb-2">
        <span className="redacted-glyphs text-sm">{glyphLine(22)}</span>
        <RoleBadge role={requiredClearance} />
      </div>
      <p className="redacted-glyphs text-xs">{glyphLine(48)}</p>
      <p className="mt-3 text-xs text-signal font-mono tracking-wide">
        CLEARANCE INSUFFICIENT — requires {requiredClearance.toUpperCase()} access.
      </p>
    </div>
  );
}
