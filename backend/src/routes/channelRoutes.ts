import { Router } from "express";
import { listChannels, getChannel } from "../controllers/channelController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", authenticate, asyncHandler(listChannels));
router.get("/:slug", authenticate, asyncHandler(getChannel));

export default router;
