import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/tokens";

/**
 * Reads the short-lived access token from the httpOnly cookie, verifies its
 * signature, and attaches the resulting { id, role } to req.user.
 *
 * This is the only place role/identity enters the request pipeline for
 * protected routes — nothing downstream ever trusts a client-supplied
 * role or user id from a body/query/header.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.access_token as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "Session expired or invalid." });
  }
}

/** Attaches req.user if a valid token is present, but never blocks the request. */
export function attachUserIfPresent(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.access_token as string | undefined;
  if (!token) {
    next();
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    // Invalid/expired token on an optional-auth route: treat as anonymous.
  }
  next();
}
