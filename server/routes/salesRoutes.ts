import express from 'express';
import CommissionsController from '../controllers/commissionsController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

// Sales commissions routes
router.get('/commissions', authMiddleware, CommissionsController.getAllSalesCommissions);
router.get('/commissions/agent/:agentId', authMiddleware, CommissionsController.getAgentSalesCommissions);

// Sales transactions routes
router.get('/transactions', authMiddleware, CommissionsController.getAllSalesTransactions);

// Sales properties routes (global, not agent-specific)
router.get('/properties', authMiddleware, CommissionsController.getAllSalesProperties);

export default router;
