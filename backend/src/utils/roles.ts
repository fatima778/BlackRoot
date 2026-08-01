/**
 * Single source of truth for the clearance hierarchy.
 * Every access-control decision in the system (routes, entries, actions)
 * must derive from this ordering — never re-implemented ad hoc elsewhere.
 */
export const ROLES = ["guest", "verified", "operative", "sysadmin"] as const;
export type Role = (typeof ROLES)[number];

const RANK: Record<Role, number> = {
  guest: 0,
  verified: 1,
  operative: 2,
  sysadmin: 3,
};

/** True if `actual` meets or exceeds `required` on the clearance ladder. */
export function meetsClearance(actual: Role, required: Role): boolean {
  return RANK[actual] >= RANK[required];
}

export function isValidRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function rankOf(role: Role): number {
  return RANK[role];
}
