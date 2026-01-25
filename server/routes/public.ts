// src/routes/public.routes.ts
import { Router } from 'express';
import {
  getRentalProperty,
  getRentalProperties,
  getSimilarRentalProperties
} from '../controllers/publicApiController';
import {
  getSalesProperty,
  getSalesProperties,
  getSimilarSalesProperties
} from '../controllers/publicApiController';

const router = Router();

// Rental property routes
router.get('/rentals', getRentalProperties);
router.get('/rentals/:id', getRentalProperty);
router.get('/rentals/:id/similar', getSimilarRentalProperties);

// Sales property routes
router.get('/sales', getSalesProperties);
router.get('/sales/:id', getSalesProperty);
router.get('/sales/:id/similar', getSimilarSalesProperties);

export default router;