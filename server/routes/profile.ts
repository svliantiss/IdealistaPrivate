import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { getProfileController, updateProfileController } from "server/controllers/profileController";

const router = express.Router();
router.get("/", authMiddleware, getProfileController);
router.patch("/", authMiddleware, updateProfileController);

export default router;
