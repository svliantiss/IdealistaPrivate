import express from 'express';
import AgentsController from '../controllers/agentsController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

// Agent routes
router.get('/', authMiddleware, AgentsController.getAllAgents);
router.get('/:id', authMiddleware, AgentsController.getAgent);
router.get('/:id/properties', authMiddleware, AgentsController.getAgentProperties);
router.get('/:id/sales-properties', authMiddleware, AgentsController.getAgentSalesProperties);

export default router;
