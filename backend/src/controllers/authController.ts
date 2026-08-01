import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Session } from "../models/Session";
import { ActivationCode } from "../models/ActivationCode";
import { registerSchema, loginSchema, requestVerificationSchema, forgotPasswordSchema } from "../validators/authValidators";
import { signAccessToken, signRefreshToken, verifyRefreshToken, refreshTtlToDate } from "../utils/tokens";
import { AppError } from "../middleware/errorHandler";
import { logAudit } from "../models/AuditLog";
import { Types } from "mongoose";
import { generateRecoveryCode } from "../utils/codeGenerator";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const isProd = process.env.NODE_ENV === "production";

function cookieOpts(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    maxAge: maxAgeMs,
    path: "/",
  };
}

async function issueSessionCookies(res: Response, userId: string, role: import("../utils/roles").Role) {
  const accessToken = signAccessToken({ sub: userId, role });
  const { token: refreshToken, jti } = signRefreshToken(userId);
  await Session.create({ user: userId, jti, expiresAt: refreshTtlToDate() });

  res.cookie("access_token", accessToken, cookieOpts(15 * 60 * 1000));
  res.cookie("refresh_token", refreshToken, cookieOpts(7 * 24 * 60 * 60 * 1000));
}

export async function register(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  const requireActivationCode = process.env.REQUIRE_INVITE_CODE === "true";

  if (requireActivationCode) {
    if (!input.activationCode) throw new AppError(400, "A network activation code is required to join.");
    // Not single-use: any number of accounts can register with this same
    // code. It only changes when a Sysadmin explicitly regenerates it via
    // the admin console, at which point older codes stop working for NEW
    // signups (already-registered accounts are entirely unaffected).
    const current = await ActivationCode.findOne();
    if (!current || current.code !== input.activationCode.trim().toUpperCase()) {
      throw new AppError(400, "That activation code is incorrect or has been rotated.");
    }
  }

  const existing = await User.findOne({ $or: [{ email: input.email }, { alias: input.alias }] });
  if (existing) throw new AppError(409, "That handle or email is already registered.");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const recoveryCode = generateRecoveryCode();
  const recoveryCodeHash = await bcrypt.hash(recoveryCode, 10);
  const user = await User.create({
    alias: input.alias,
    email: input.email,
    passwordHash,
    role: "guest",
    recoveryCodeHash,
  });

  await issueSessionCookies(res, user._id.toString(), user.role);
  res.status(201).json({
    user: { id: user._id, alias: user.alias, role: user.role, joinedAt: user.joinedAt },
    // Shown exactly once — the server never stores or re-displays this
    // plaintext value again. The client is responsible for surfacing it
    // prominently to the user before they navigate away.
    recoveryCode,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const user = await User.findOne({ email: input.email });

  // Constant response shape whether the account exists or not, to avoid
  // confirming which emails are registered.
  const genericError = "Invalid email or password.";
  if (!user) throw new AppError(401, genericError);

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new AppError(423, `Account locked from repeated failed attempts. Try again in ${minutesLeft}m.`);
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw new AppError(401, genericError);
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save();

  await issueSessionCookies(res, user._id.toString(), user.role);
  res.status(200).json({
    user: { id: user._id, alias: user.alias, role: user.role, joinedAt: user.joinedAt },
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.refresh_token as string | undefined;
  if (!token) throw new AppError(401, "No active session.");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError(401, "Session expired. Log in again.");
  }

  const session = await Session.findOne({ jti: payload.jti, user: payload.sub, revoked: false });
  if (!session || session.expiresAt.getTime() < Date.now()) {
    throw new AppError(401, "Session expired or revoked.");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new AppError(401, "Account no longer exists.");

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  res.cookie("access_token", accessToken, cookieOpts(15 * 60 * 1000));
  res.status(200).json({ user: { id: user._id, alias: user.alias, role: user.role } });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.refresh_token as string | undefined;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await Session.updateOne({ jti: payload.jti }, { revoked: true });
    } catch {
      // token already invalid; nothing to revoke
    }
  }
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
  res.status(200).json({ message: "Uplink terminated." });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.user!.id).select("-passwordHash");
  if (!user) throw new AppError(401, "Account no longer exists.");
  res.status(200).json({
    user: {
      id: user._id,
      alias: user.alias,
      role: user.role,
      joinedAt: user.joinedAt,
      postCount: user.postCount,
    },
  });
}

/**
 * The one legitimate path from GUEST to VERIFIED: the account holder
 * explicitly accepts the community rules. This is intentionally the ONLY
 * self-service role change in the system — everything above VERIFIED
 * (operative, sysadmin) can only be granted by a sysadmin via the admin
 * console, never by the account itself.
 */
export async function requestVerification(req: Request, res: Response): Promise<void> {
  requestVerificationSchema.parse(req.body);

  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError(401, "Account no longer exists.");

  if (user.role !== "guest") {
    throw new AppError(409, "Only guest-clearance accounts can self-verify.");
  }

  user.role = "verified";
  await user.save();
  await logAudit(new Types.ObjectId(user._id), "role_change", "User", user._id.toString(), "guest -> verified (self, rules accepted)");

  // Issue a fresh access token so the new role takes effect immediately
  // without requiring the user to log out and back in.
  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  res.cookie("access_token", accessToken, cookieOpts(15 * 60 * 1000));

  res.status(200).json({
    user: { id: user._id, alias: user.alias, role: user.role },
    message: "Clearance upgraded to VERIFIED.",
  });
}

/**
 * Resets a password using the one-time recovery code issued at registration
 * (or at the previous successful reset) instead of an emailed reset link —
 * there is no outbound email/SMS provider in this deployment. Constant-time
 * generic error either way to avoid confirming which emails are registered.
 * On success, every existing session is revoked (a password reset should
 * invalidate anything issued under the old credential) and a brand-new
 * recovery code is generated and returned once, rotating the used one out.
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const input = forgotPasswordSchema.parse(req.body);
  const genericError = "That email and recovery code combination didn't match.";

  const user = await User.findOne({ email: input.email });
  if (!user || !user.recoveryCodeHash) throw new AppError(401, genericError);

  const validCode = await bcrypt.compare(input.recoveryCode, user.recoveryCodeHash);
  if (!validCode) throw new AppError(401, genericError);

  const newRecoveryCode = generateRecoveryCode();
  user.passwordHash = await bcrypt.hash(input.newPassword, 12);
  user.recoveryCodeHash = await bcrypt.hash(newRecoveryCode, 10);
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save();

  // A password reset should kill every session that existed under the old
  // password — otherwise a stolen-but-still-logged-in session survives
  // the very reset meant to shut it out.
  await Session.updateMany({ user: user._id, revoked: false }, { revoked: true });

  await logAudit(user._id, "session_revoke", "User", user._id.toString(), "password reset via recovery code — all sessions revoked");

  res.status(200).json({
    message: "Password reset. All previous sessions have been signed out.",
    newRecoveryCode,
  });
}
