import { Request, Response, NextFunction } from "express";
import { Role, meetsClearance } from "../utils/roles";

/**
 * Blocks the request unless the authenticated user's role meets `required`.
 * Always applied to routes/controllers server-side — never relied on as the
 * only gate (the query layer additionally filters data; see entryController).
 *
 * Deliberately returns 404 rather than 403 for resource-shaped routes so an
 * unauthorized user cannot distinguish "doesn't exist" from "exists but
 * you're not cleared" (see Section 6 — existence should not leak).
 */
export function requireClearance(required: Role, mode: "403" | "404" = "403") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Not authenticated." });
      return;
    }
    if (!meetsClearance(user.role, required)) {
      if (mode === "404") {
        res.status(404).json({ error: "Route not found." });
      } else {
        res.status(403).json({ error: "Insufficient clearance." });
      }
      return;
    }
    next();
  };
}

/** Only sysadmin may pass. Used for the entire admin console router. */
export function requireSysadmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }
  if (req.user.role !== "sysadmin") {
    res.status(404).json({ error: "Route not found." });
    return;
  }
  next();
}

/**
 * Allows the request through if the user owns `ownerId` OR holds at least
 * `overrideRole` clearance (e.g. edit-your-own-post, but a Sysadmin can act
 * on anyone's). Ownership is compared against the authenticated user id,
 * never a client-supplied field.
 */
export function isOwnerOrRole(userId: string, userRole: Role, ownerId: string, overrideRole: Role): boolean {
  if (userId === ownerId) return true;
  return meetsClearance(userRole, overrideRole);
}
