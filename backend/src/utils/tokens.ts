import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { Role } from "./roles";

export interface AccessTokenPayload {
  sub: string; // user id
  role: Role;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL ?? "15m";
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL ?? "7d";

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error("JWT secrets are not configured. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.");
}

// @types/jsonwebtoken types `expiresIn` as a narrow literal union, not `string`.
// The TTLs above are validated, correctly-shaped strings ("15m", "7d", etc.)
// coming from env config — this cast just tells TS to trust that shape.
const accessOptions: SignOptions = { expiresIn: ACCESS_TTL as SignOptions["expiresIn"] };
const refreshOptions: SignOptions = { expiresIn: REFRESH_TTL as SignOptions["expiresIn"] };

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, accessOptions);
}

export function signRefreshToken(userId: string): { token: string; jti: string } {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: userId, jti }, REFRESH_SECRET, refreshOptions);
  return { token, jti };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
}

export function refreshTtlToDate(): Date {
  // Mirrors REFRESH_TTL for the Session document's expiresAt field.
  const match = /^(\d+)([smhd])$/.exec(REFRESH_TTL);
  const amount = match ? Number(match[1]) : 7;
  const unit = match ? match[2] : "d";
  const ms = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit as "s" | "m" | "h" | "d"];
  return new Date(Date.now() + amount * ms);
}
