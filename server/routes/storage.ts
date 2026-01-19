import express from "express";
import { storageController } from "../controllers/storageController";
import { authMiddleware } from "../middlewares/authMiddleware";


const router = express.Router();
router.post("/upload-url", storageController);

export default router;
