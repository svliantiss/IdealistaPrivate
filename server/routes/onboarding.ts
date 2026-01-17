import express from "express";
import { step3Branding, step4Contact } from "../controllers/onboardingController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();
router.post("/step3", authMiddleware, step3Branding);
router.post("/step4", authMiddleware, step4Contact);

export default router;
