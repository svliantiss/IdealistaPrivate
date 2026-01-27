import { Request, Response } from 'express';
import { prisma } from '../db';

export class BookingsController {
  // Get all bookings
  async getAllBookings(req: Request, res: Response) {
    try {
      const { status, agentId, propertyId } = req.query;

      const where: any = {};

      if (status) where.status = status;
      if (agentId) {
        where.OR = [
          { ownerAgentId: Number(agentId) },
          { bookingAgentId: Number(agentId) }
        ];
      }
      if (propertyId) where.propertyId = Number(propertyId);

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              location: true,
              propertyType: true,
              media: true
            }
          },
          ownerAgent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          bookingAgent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
    }
  }

  // Get single booking
  async getBooking(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const booking = await prisma.booking.findUnique({
        where: { id: Number(id) },
        include: {
          property: true,
          ownerAgent: true,
          bookingAgent: true,
          commission: true
        }
      });

      if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }

      res.json(booking);
    } catch (error) {
      console.error('Error fetching booking:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch booking' });
    }
  }

  // Create booking
  async createBooking(req: Request, res: Response) {
    try {
      const {
        propertyId,
        ownerAgentId,
        bookingAgentId,
        clientName,
        clientEmail,
        clientPhone,
        checkIn,
        checkOut,
        totalAmount
      } = req.body;

      // Validate required fields
      if (!propertyId || !ownerAgentId || !bookingAgentId || !clientName || !clientEmail || !checkIn || !checkOut || !totalAmount) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      // Check if property exists
      const property = await prisma.property.findUnique({
        where: { id: Number(propertyId) }
      });

      if (!property) {
        return res.status(404).json({ success: false, error: 'Property not found' });
      }

      // Check for overlapping bookings
      const overlapping = await prisma.booking.findFirst({
        where: {
          propertyId: Number(propertyId),
          status: { not: 'cancelled' },
          OR: [
            {
              checkIn: { lte: new Date(checkOut) },
              checkOut: { gte: new Date(checkIn) }
            }
          ]
        }
      });

      if (overlapping) {
        return res.status(400).json({
          success: false,
          error: 'Property is already booked for these dates'
        });
      }

      const booking = await prisma.booking.create({
        data: {
          propertyId: Number(propertyId),
          ownerAgentId: Number(ownerAgentId),
          bookingAgentId: Number(bookingAgentId),
          clientName,
          clientEmail,
          clientPhone,
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          totalAmount: Number(totalAmount),
          status: 'pending'
        },
        include: {
          property: true,
          ownerAgent: true,
          bookingAgent: true
        }
      });

      // Create availability block for the booking
      await prisma.propertyAvailability.create({
        data: {
          propertyId: Number(propertyId),
          startDate: new Date(checkIn),
          endDate: new Date(checkOut),
          isAvailable: false,
          bookingId: booking.id,
          notes: `Booking for ${clientName}`
        }
      });

      res.status(201).json({ success: true, data: booking });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ success: false, error: 'Failed to create booking' });
    }
  }

  // Update booking status
  async updateBookingStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }

      const booking = await prisma.booking.update({
        where: { id: Number(id) },
        data: { status },
        include: {
          property: true,
          ownerAgent: true,
          bookingAgent: true
        }
      });

      res.json({ success: true, data: booking });
    } catch (error) {
      console.error('Error updating booking status:', error);
      res.status(500).json({ success: false, error: 'Failed to update booking status' });
    }
  }
}

export default new BookingsController();
