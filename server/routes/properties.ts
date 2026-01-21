import express from 'express';
import PropertiesController from '../controllers/propertiesController';

const router = express.Router();

// ==========================
// RENTAL PROPERTIES ROUTES
// ==========================
router.get('/rental', PropertiesController.getRentalProperties);
router.get('/rental/:id', PropertiesController.getRentalProperty);
router.post('/rental', PropertiesController.createRentalProperty);
router.put('/rental/:id', PropertiesController.updateRentalProperty);
router.patch('/rental/:id/status', PropertiesController.updatePropertyStatus);
router.delete('/rental/:id', PropertiesController.deleteRentalProperty);

// ==========================
// SALES PROPERTIES ROUTES
// ==========================
router.get('/sales', PropertiesController.getSalesProperties);
router.get('/sales/:id', PropertiesController.getSalesProperty);
router.post('/sales', PropertiesController.createSalesProperty);

// ==========================
// AVAILABILITY ROUTES
// ==========================
router.get('/:propertyId/availability', PropertiesController.getPropertyAvailability);
router.patch('/:propertyId/availability', PropertiesController.updatePropertyAvailability);

// ==========================
// DASHBOARD & STATISTICS
// ==========================
router.get('/agency/:agencyId/stats', PropertiesController.getPropertyStats);
router.post('/bulk/status', PropertiesController.bulkUpdatePropertyStatus);

export default router;