import { Role } from "../api/client";

const RANK: Record<Role, number> = { guest: 0, verified: 1, operative: 2, sysadmin: 3 };

/**
 * UI-only convenience for showing/hiding nav links and controls.
 * The server independently re-enforces every one of these checks —
 * this function never gates what data actually gets fetched.
 */
export function meetsClearance(actual: Role, required: Role): boolean {
  return RANK[actual] >= RANK[required];
}
