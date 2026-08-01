import crypto from "crypto";

/**
 * Generates a human-typeable code formatted like "A3F9-K7QX-2MPZ-9RTL".
 * Shared by two distinct features that both need a short, unambiguous,
 * copy-pasteable secret:
 *  - a per-user recovery code (password reset without email/SMS)
 *  - the single, sysadmin-controlled network activation code (guest signup)
 */
function generateGroupedCode(groupCount = 4): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
  const groups: string[] = [];
  for (let g = 0; g < groupCount; g += 1) {
    let group = "";
    for (let i = 0; i < 4; i += 1) {
      group += alphabet[crypto.randomInt(alphabet.length)];
    }
    groups.push(group);
  }
  return groups.join("-");
}

/** Per-user, one-time-shown, rotated on every successful password reset. */
export function generateRecoveryCode(): string {
  return generateGroupedCode(4);
}

/** Single shared code, sysadmin-controlled, reused by any number of new signups. */
export function generateActivationCode(): string {
  return generateGroupedCode(3);
}
