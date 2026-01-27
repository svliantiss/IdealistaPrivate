import express from 'express';
import CommissionsController from '../controllers/commissionsController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

// Commission routes
router.get('/', authMiddleware, CommissionsController.getAllCommissions);
router.get('/agent/:agentId', authMiddleware, CommissionsController.getAgentCommissions);

export default router;
