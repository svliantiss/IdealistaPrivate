import express from 'express';
import PropertiesController from '../controllers/propertiesController';
import { authMiddleware } from 'server/middlewares/authMiddleware';

const router = express.Router();

// ==========================
// RENTAL PROPERTIES ROUTES
// ==========================
router.get('/rental', authMiddleware, PropertiesController.getRentalProperties);
router.get('/rental/:id', authMiddleware, PropertiesController.getRentalProperty);
router.post('/rental', authMiddleware, PropertiesController.createRentalProperty);
router.put('/rental/:id', authMiddleware, PropertiesController.updateRentalProperty);
router.patch('/rental/:id/status', authMiddleware, PropertiesController.updatePropertyStatus);
router.delete('/rental/:id', authMiddleware, PropertiesController.deleteRentalProperty);

// ==========================
// SALES PROPERTIES ROUTES
// ==========================
router.patch('/sales/:id', authMiddleware, PropertiesController.updateSalesProperty);
router.get('/sales', authMiddleware, PropertiesController.getSalesProperties);
router.get('/sales/:id', authMiddleware, PropertiesController.getSalesProperty);
router.delete('/sales/:id', authMiddleware, PropertiesController.deleteSalesProperty);
router.patch('/sales/:id/status', authMiddleware, PropertiesController.updateSalesPropertyStatus);

router.post('/sales', authMiddleware, PropertiesController.createSalesProperty);

// ==========================
// AVAILABILITY ROUTES
// ==========================
router.get('/:propertyId/availability', authMiddleware, PropertiesController.getPropertyAvailability);
router.patch('/:propertyId/availability', authMiddleware, PropertiesController.updatePropertyAvailability);

// ==========================
// DASHBOARD & STATISTICS
// ==========================
router.get('/agency/:agencyId/stats', authMiddleware, PropertiesController.getPropertyStats);
router.post('/bulk/status', authMiddleware, PropertiesController.bulkUpdatePropertyStatus);

export default router;