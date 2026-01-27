import express from 'express';
import CommissionsController from '../controllers/commissionsController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

// Property availability routes
router.get('/', authMiddleware, CommissionsController.getAllPropertyAvailability);

export default router;
