import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireSysadmin } from "../middleware/rbac";
import { asyncHandler } from "../utils/asyncHandler";
import {
  listUsers,
  changeUserRole,
  revokeUserSessions,
  getActivationCode,
  regenerateActivationCode,
  adminListChannels,
  createChannel,
  updateChannel,
  archiveChannel,
  adminListEntries,
  setEntryClearance,
  purgeEntry,
  setEntryLock,
  listAuditLog,
} from "../controllers/adminController";

const router = Router();

// Every route below is unreachable without a verified sysadmin token —
// applied once here so no individual route can accidentally be left open.
router.use(authenticate, requireSysadmin);

router.get("/users", asyncHandler(listUsers));
router.patch("/users/:userId/role", asyncHandler(changeUserRole));
router.post("/users/:userId/revoke-sessions", asyncHandler(revokeUserSessions));

router.get("/activation-code", asyncHandler(getActivationCode));
router.post("/activation-code/regenerate", asyncHandler(regenerateActivationCode));

router.get("/channels", asyncHandler(adminListChannels));
router.post("/channels", asyncHandler(createChannel));
router.patch("/channels/:channelId", asyncHandler(updateChannel));
router.post("/channels/:channelId/archive", asyncHandler(archiveChannel));

router.get("/entries", asyncHandler(adminListEntries));
router.patch("/entries/:entryId/clearance", asyncHandler(setEntryClearance));
router.patch("/entries/:entryId/lock", asyncHandler(setEntryLock));
router.delete("/entries/:entryId", asyncHandler(purgeEntry));

router.get("/audit-log", asyncHandler(listAuditLog));

export default router;
