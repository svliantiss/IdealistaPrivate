import express from "express";
import { storageController, directUploadController, uploadMiddleware } from "../controllers/storageController";
import { authMiddleware } from "../middlewares/authMiddleware";


const router = express.Router();
router.post("/upload-url", storageController);
router.post("/upload", uploadMiddleware, directUploadController); // NEW: Direct upload through backend

export default router;
