
import express from "express";
import { requestOtp, verifyOtpController, requestLoginOtp, verifyLoginOtpController } from "../controllers/authController";

const router = express.Router();
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtpController);
router.post("/request-login-otp", requestLoginOtp);
router.post("/verify-login-otp", verifyLoginOtpController);

export default router;
