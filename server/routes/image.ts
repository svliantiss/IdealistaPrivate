// src/routes/imageConversionRoutes.ts
import express from 'express';
import { convertImage, healthCheck, convertImagesBatch } from '../controllers/imageConvertController';

const router = express.Router();

// GET endpoint for single image conversion
router.get('/convert', convertImage);

// POST endpoint for batch conversion
router.post('/convert/batch', convertImagesBatch);

// Health check
router.get('/health', healthCheck);

export default router;