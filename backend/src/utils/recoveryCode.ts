import crypto from "crypto";

/**
 * Generates a human-typeable recovery code, formatted like "A3F9-K7QX-2MPZ-9RTL".
 * This is shown to the user exactly once (at registration, and again each
 * time they successfully use one to reset their password) and only its
 * bcrypt hash is ever persisted — the same trust model as 2FA backup codes.
 */
export function generateRecoveryCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
  const groups: string[] = [];
  for (let g = 0; g < 4; g += 1) {
    let group = "";
    for (let i = 0; i < 4; i += 1) {
      group += alphabet[crypto.randomInt(alphabet.length)];
    }
    groups.push(group);
  }
  return groups.join("-");
}
