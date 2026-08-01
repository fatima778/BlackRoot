import { Role } from "../api/client";

const STYLES: Record<Role, { label: string; classes: string }> = {
  guest: { label: "GUEST", classes: "text-muted border-hairline" },
  verified: { label: "VERIFIED", classes: "text-jade border-jade/40" },
  operative: { label: "OPERATIVE", classes: "text-mint border-emerald bg-emerald/20" },
  sysadmin: { label: "SYSADMIN", classes: "text-void bg-jade border-jade" },
};

export function RoleBadge({ role }: { role: Role }) {
  const style = STYLES[role] ?? { label: "UNKNOWN", classes: "text-muted border-hairline" };
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-mono tracking-[0.12em] ${style.classes}`}
    >
      {style.label}
    </span>
  );
}
