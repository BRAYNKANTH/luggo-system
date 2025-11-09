import express from "express";
import {
  registerUser,
  googleLogin,
  verifyEmail,
  verifyPhone,
  loginUser,
  forgotPassword,
  resetPassword,
} from "../controllers/AuthController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/google-login", googleLogin);
router.get("/verify-email", verifyEmail);
router.post("/verify-phone", verifyPhone);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
