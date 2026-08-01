import { Router } from "express";
import { register, login, refresh, logout, me, requestVerification, forgotPassword } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { loginLimiter, registerLimiter, forgotPasswordLimiter } from "../middleware/rateLimit";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/register", registerLimiter, asyncHandler(register));
router.post("/login", loginLimiter, asyncHandler(login));
router.post("/refresh", asyncHandler(refresh));
router.post("/logout", asyncHandler(logout));
router.get("/me", authenticate, asyncHandler(me));
router.post("/verify", authenticate, asyncHandler(requestVerification));
router.post("/forgot-password", forgotPasswordLimiter, asyncHandler(forgotPassword));

export default router;
