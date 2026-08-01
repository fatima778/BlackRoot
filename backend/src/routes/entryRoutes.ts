import { Router } from "express";
import {
  listEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  addReply,
  flagEntry,
  searchEntries,
} from "../controllers/entryController";
import { authenticate } from "../middleware/auth";
import { requireClearance } from "../middleware/rbac";
import { searchLimiter } from "../middleware/rateLimit";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authenticate);

router.get("/search", searchLimiter, asyncHandler(searchEntries));
router.get("/channel/:channelId", asyncHandler(listEntries));
router.get("/:entryId", asyncHandler(getEntry));
router.post("/", requireClearance("verified"), asyncHandler(createEntry));
router.patch("/:entryId", requireClearance("verified"), asyncHandler(updateEntry));
router.delete("/:entryId", requireClearance("verified"), asyncHandler(deleteEntry));
router.post("/:entryId/replies", requireClearance("verified"), asyncHandler(addReply));
router.post("/:entryId/flag", requireClearance("verified"), asyncHandler(flagEntry));

export default router;
