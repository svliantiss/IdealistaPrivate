import express from 'express';
import BookingsController from '../controllers/bookingsController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

// Booking routes
router.get('/', authMiddleware, BookingsController.getAllBookings);
router.get('/:id', authMiddleware, BookingsController.getBooking);
router.post('/', authMiddleware, BookingsController.createBooking);
router.patch('/:id/status', authMiddleware, BookingsController.updateBookingStatus);

export default router;
