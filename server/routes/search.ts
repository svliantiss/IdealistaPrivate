// src/routes/public/search.routes.ts
import express from 'express';
import {
  searchRentalProperties,
  searchSalesProperties,
  getFilterOptions,
  quickSearch
} from './../controllers/search.controller';

const router = express.Router();

// Search rental properties with advanced filtering
router.get('/rentals', searchRentalProperties);

// Search sales properties with advanced filtering
router.get('/sales', searchSalesProperties);

// Get filter options for search forms
router.get('/filters', getFilterOptions);

// Quick search for autocomplete
router.get('/quick', quickSearch);

export default router;