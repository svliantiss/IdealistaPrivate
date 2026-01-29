// src/routes/booking.routes.ts
import express from 'express';
import { BookingController } from '../controllers/bookingController';

const router = express.Router();

// Public routes
router.get('/stats', BookingController.getBookingStats);

// Booking management
router.post('/', BookingController.createBooking);
router.get('/', BookingController.getAllBookings);
router.get('/:id', BookingController.getBookingById);
router.put('/:id', BookingController.updateBooking);
router.delete('/:id', BookingController.deleteBooking);

// Status management
router.patch('/:id/status', BookingController.updateBookingStatus);
router.patch('/:id/request-cancellation', BookingController.requestCancellation);

// Property-specific bookings
router.get('/property/:propertyId', BookingController.getPropertyBookings);

// Agent-specific bookings
router.get('/agent/:agentId', BookingController.getAgentBookings);
router.get('/agent/:agentId/booking-requests', BookingController.getBookingRequests);

// Agency bookings
router.get('/agency/:agencyId', BookingController.getAgencyBookings);

export default router;