// src/controllers/booking.controller.ts
import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';




import { prisma } from "../db";

// Validation Schemas
const createBookingSchema = z.object({
  propertyId: z.number().int().positive(),
  ownerAgentId: z.number().int().positive(),
  bookingAgentId: z.number().int().positive().optional(),
  clientName: z.string().min(2, 'Client name must be at least 2 characters'),
  clientEmail: z.string().email('Invalid email address'),
  clientPhone: z.string().min(5, 'Phone number must be at least 5 characters'),
  additionNote: z.string().optional(),
  checkIn: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid check-in date',
  }),
  checkOut: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid check-out date',
  }),
  totalAmount: z.number().positive('Total amount must be positive'),
});

const updateBookingSchema = z.object({
  clientName: z.string().min(2).optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().min(5).optional(),
  additionNote: z.string().optional(),
  checkIn: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  checkOut: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  totalAmount: z.number().positive().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'cancellation_requested', 'archived']).optional(),
});

const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'cancellation_requested', 'archived', 'paid']),
});

const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'cancellation_requested', 'archived', 'paid']).optional(),
  propertyId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  agencyId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  agentId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});

// Helper function to calculate duration
const calculateDuration = (checkIn: Date, checkOut: Date): string => {
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 night';
  if (diffDays <= 7) return `${diffDays} nights`;
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks`;
  return `${Math.floor(diffDays / 30)} months`;
};

// Helper function to check property availability
const checkPropertyAvailability = async (
  propertyId: number,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: number
): Promise<boolean> => {
  const conflictingAvailability = await prisma.propertyAvailability.findFirst({
    where: {
      propertyId,
      OR: [
        {
          AND: [
            { startDate: { lte: checkOut } },
            { endDate: { gte: checkIn } },
          ],
        },
      ],
      isAvailable: false,
      bookingId: excludeBookingId ? { not: excludeBookingId } : undefined,
    },
  });

  return !conflictingAvailability;
};

// Calculate commission amounts
const calculateCommission = (
  totalAmount: number,
  commissionRate: number = 10
) => {
  const commissionAmount = (totalAmount * commissionRate) / 100;
  const platformFee = commissionAmount * 0.2; // 20% platform fee
  const agentCommission = commissionAmount - platformFee;
  
  // Split commission between owner agent and booking agent (if different)
  const ownerCommission = agentCommission * 0.7; // 70% to owner agent
  const bookingCommission = agentCommission * 0.3; // 30% to booking agent

  return {
    totalAmount: commissionAmount,
    ownerCommission,
    bookingCommission,
    platformFee,
  };
};

export class BookingController {
  // Create a new booking
  static async createBooking(req: Request, res: Response) {
    try {
      // Validate request body
      const validationResult = createBookingSchema.safeParse(req.body);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      const {
        propertyId,
        ownerAgentId,
        bookingAgentId,
        clientName,
        clientEmail,
        clientPhone,
        additionNote,
        checkIn,
        checkOut,
        totalAmount,
      } = validationResult.data;

      // Parse dates
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      // Validate dates
      if (checkInDate >= checkOutDate) {
        return res.status(400).json({
          success: false,
          error: 'Check-out date must be after check-in date',
        });
      }

      // Check if property exists
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          agency: true,
          createdBy: true,
        },
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          error: 'Property not found',
        });
      }

      // Check if agents exist
      const ownerAgent = await prisma.agent.findUnique({
        where: { id: ownerAgentId },
        include: { agency: true },
      });

      if (!ownerAgent) {
        return res.status(404).json({
          success: false,
          error: 'Owner agent not found',
        });
      }

      let bookingAgent = null;
      if (bookingAgentId) {
        bookingAgent = await prisma.agent.findUnique({
          where: { id: bookingAgentId },
          include: { agency: true },
        });

        if (!bookingAgent) {
          return res.status(404).json({
            success: false,
            error: 'Booking agent not found',
          });
        }
      }

      // Check property availability
      const isAvailable = await checkPropertyAvailability(
        propertyId,
        checkInDate,
        checkOutDate
      );

      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          error: 'Property is not available for the selected dates',
        });
      }

      // Calculate duration
      const duration = calculateDuration(checkInDate, checkOutDate);

      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create booking
        const booking = await tx.booking.create({
          data: {
            propertyId,
            ownerAgentId,
            bookingAgentId: bookingAgentId || ownerAgentId,
            clientName,
            clientEmail,
            clientPhone,
            additionNote,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            duration,
            totalAmount,
            status: 'pending',
          },
          include: {
            property: {
              include: {
                agency: true,
              },
            },
            ownerAgent: true,
            bookingAgent: true,
          },
        });

        // Create availability blocks
        await tx.propertyAvailability.createMany({
          data: [
            {
              propertyId,
              startDate: checkInDate,
              endDate: checkOutDate,
              isAvailable: false,
              bookingId: booking.id,
              notes: `Booked by ${clientName}`,
            },
          ],
        });

        // Calculate and create commission
        const commissionRate = property.agency.primaryColor ? 10 : 8; // Example logic
        const commissionAmounts = calculateCommission(totalAmount, commissionRate);

        const commission = await tx.commission.create({
          data: {
            bookingId: booking.id,
            ownerAgentId,
            bookingAgentId: bookingAgentId || ownerAgentId,
            totalAmount: commissionAmounts.totalAmount,
            ownerCommission: commissionAmounts.ownerCommission,
            bookingCommission: commissionAmounts.bookingCommission,
            platformFee: commissionAmounts.platformFee,
            commissionRate,
            status: 'pending',
          },
        });

        return { booking, commission };
      });

      return res.status(201).json({
        success: true,
        data: {
          booking: result.booking,
          commission: result.commission,
        },
        message: 'Booking created successfully',
      });

    } catch (error: any) {
      console.error('Error creating booking:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create booking',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Get all bookings with pagination and filters
  static async getAllBookings(req: Request, res: Response) {
    console.log({query: req.query});
    try {
      // Validate query parameters
      const validationResult = querySchema.safeParse(req.query);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      const {
        page = 1,
        limit = 20,
        status,
        propertyId,
        agencyId,
        agentId,
        startDate,
        endDate,
        search,
      } = validationResult.data;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (propertyId) {
        where.propertyId = propertyId;
      }

      if (agencyId) {
        where.OR = [
          { property: { agencyId } },
          { ownerAgent: { agencyId } },
          { bookingAgent: { agencyId } },
        ];
      }

      if (agentId) {
        where.OR = [
          { ownerAgentId: agentId },
          { bookingAgentId: agentId },
        ];
      }

      if (startDate || endDate) {
        where.checkIn = {};
        if (startDate) {
          where.checkIn.gte = new Date(startDate);
        }
        if (endDate) {
          where.checkIn.lte = new Date(endDate);
        }
      }

      if (search) {
        where.OR = [
          { clientName: { contains: search, mode: 'insensitive' } },
          { clientEmail: { contains: search, mode: 'insensitive' } },
          { clientPhone: { contains: search, mode: 'insensitive' } },
          { property: { title: { contains: search, mode: 'insensitive' } } },
        ];
      }

      // Get total count for pagination
      const totalCount = await prisma.booking.count({ where });

      // Get bookings with related data
      const bookings = await prisma.booking.findMany({
        where,
        include: {
          property: {
            include: {
              agency: true,
            },
          },
          ownerAgent: {
            include: {
              agency: true,
            },
          },
          bookingAgent: {
            include: {
              agency: true,
            },
          },
          commission: true,
          availability: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      });

      // Calculate summary stats
      const stats = await prisma.booking.aggregate({
        where,
        _sum: {
          totalAmount: true,
        },
        _count: {
          id: true,
        },
      });

      const statusStats = await prisma.booking.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true,
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          bookings,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: Math.ceil(totalCount / limit),
          },
          stats: {
            totalBookings: stats._count.id,
            totalRevenue: stats._sum.totalAmount || 0,
            statusBreakdown: statusStats.reduce((acc, stat) => {
              acc[stat.status] = stat._count.id;
              return acc;
            }, {} as Record<string, number>),
          },
        },
      });

    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch bookings',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Get booking by ID
  static async getBookingById(req: Request, res: Response) {
    try {
      const bookingId = parseInt(req.params.id);
      if (isNaN(bookingId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid booking ID',
        });
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          property: {
            include: {
              agency: true,
              createdBy: true,
            },
          },
          ownerAgent: {
            include: {
              agency: true,
            },
          },
          bookingAgent: {
            include: {
              agency: true,
            },
          },
          commission: true,
          availability: true,
        },
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: booking,
      });

    } catch (error: any) {
      console.error('Error fetching booking:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch booking',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Update booking
  static async updateBooking(req: Request, res: Response) {
    try {
      const bookingId = parseInt(req.params.id);
      if (isNaN(bookingId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid booking ID',
        });
      }

      // Validate request body
      const validationResult = updateBookingSchema.safeParse(req.body);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      const updateData = validationResult.data;

      // Check if booking exists
      const existingBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          property: true,
          availability: true,
        },
      });

      if (!existingBooking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
        });
      }

      // Handle status changes
      if (updateData.status && updateData.status !== existingBooking.status) {
        if (updateData.status === 'cancelled') {
          // Free up availability slots when cancelling
          await prisma.propertyAvailability.updateMany({
            where: {
              bookingId,
            },
            data: {
              isAvailable: true,
              bookingId: null,
              notes: 'Cancelled',
            },
          });
        } else if (updateData.status === 'confirmed' && existingBooking.status === 'pending') {
          // Send confirmation email logic would go here
        } else if (updateData.status === 'cancellation_requested') {
          // Keep availability blocked but mark as cancellation requested
        } else if (updateData.status === 'archived') {
          // Archive the booking - don't change availability
        }
      }

      // Handle date changes
      let duration = existingBooking.duration;
      if (updateData.checkIn || updateData.checkOut) {
        const checkInDate = updateData.checkIn ? new Date(updateData.checkIn) : existingBooking.checkIn;
        const checkOutDate = updateData.checkOut ? new Date(updateData.checkOut) : existingBooking.checkOut;

        if (checkInDate >= checkOutDate) {
          return res.status(400).json({
            success: false,
            error: 'Check-out date must be after check-in date',
          });
        }

        // Check availability for new dates
        const isAvailable = await checkPropertyAvailability(
          existingBooking.propertyId,
          checkInDate,
          checkOutDate,
          bookingId
        );

        if (!isAvailable) {
          return res.status(400).json({
            success: false,
            error: 'Property is not available for the new dates',
          });
        }

        // Update duration
        duration = calculateDuration(checkInDate, checkOutDate);

        // Update availability
        await prisma.propertyAvailability.updateMany({
          where: { bookingId },
          data: {
            startDate: checkInDate,
            endDate: checkOutDate,
            notes: `Updated booking for ${updateData.clientName || existingBooking.clientName}`,
          },
        });
      }

      // Update booking
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          ...updateData,
          duration: updateData.checkIn || updateData.checkOut ? duration : undefined,
          checkIn: updateData.checkIn ? new Date(updateData.checkIn) : undefined,
          checkOut: updateData.checkOut ? new Date(updateData.checkOut) : undefined,
        },
        include: {
          property: {
            include: {
              agency: true,
            },
          },
          ownerAgent: true,
          bookingAgent: true,
          commission: true,
          availability: true,
        },
      });

      // Update commission if total amount changed
      if (updateData.totalAmount !== undefined && updateData.totalAmount !== existingBooking.totalAmount) {
        const commission = await prisma.commission.findFirst({
          where: { bookingId },
        });

        if (commission) {
          const commissionAmounts = calculateCommission(updateData.totalAmount, commission.commissionRate.toNumber());
          
          await prisma.commission.update({
            where: { id: commission.id },
            data: {
              totalAmount: commissionAmounts.totalAmount,
              ownerCommission: commissionAmounts.ownerCommission,
              bookingCommission: commissionAmounts.bookingCommission,
              platformFee: commissionAmounts.platformFee,
            },
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: updatedBooking,
        message: 'Booking updated successfully',
      });

    } catch (error: any) {
      console.error('Error updating booking:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update booking',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Delete booking (soft delete by archiving)
  static async deleteBooking(req: Request, res: Response) {
    try {
      const bookingId = parseInt(req.params.id);
      if (isNaN(bookingId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid booking ID',
        });
      }

      // Check if booking exists
      const existingBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!existingBooking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
        });
      }

      // Instead of deleting, update status to archived
      await prisma.$transaction(async (tx) => {
        // Update booking status
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: 'archived',
          },
        });
      });

      return res.status(200).json({
        success: true,
        message: 'Booking archived successfully',
      });

    } catch (error: any) {
      console.error('Error deleting booking:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete booking',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // NEW: Update booking status only
  static async updateBookingStatus(req: Request, res: Response) {
    try {
      const bookingId = parseInt(req.params.id);
      if (isNaN(bookingId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid booking ID',
        });
      }

      // Validate request body
      const validationResult = updateBookingStatusSchema.safeParse(req.body);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      const { status } = validationResult.data;

      // Check if booking exists
      const existingBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          property: true,
          availability: true,
        },
      });

      if (!existingBooking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
        });
      }

      // Handle status changes
      let availabilityUpdate = {};
      let notes = '';

      if (status === 'cancelled' || status === 'archived') {
        // Free up availability slots
        availabilityUpdate = {
          isAvailable: true,
          bookingId: null,
          notes: status === 'cancelled' ? 'Cancelled' : 'Archived',
        };
        notes = `Booking ${status}`;
      } else if (status === 'confirmed' && existingBooking.status === 'pending') {
        notes = 'Booking confirmed';
        // Availability remains blocked
        availabilityUpdate = {
          notes: 'Confirmed booking',
        };
      } else if (status === 'cancellation_requested') {
        notes = 'Cancellation requested';
        // Keep availability blocked
        availabilityUpdate = {
          notes: 'Cancellation requested',
        };
      } else if (status === 'paid') {
        notes = 'Booking paid';
        // Update commission status
        await prisma.commission.updateMany({
          where: { bookingId },
          data: { status: 'paid' },
        });
      }

      // Update booking status
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status,
        },
        include: {
          property: {
            include: {
              agency: true,
            },
          },
          ownerAgent: true,
          bookingAgent: true,
          commission: true,
        },
      });

      // Update availability if needed
      if (Object.keys(availabilityUpdate).length > 0) {
        await prisma.propertyAvailability.updateMany({
          where: { bookingId },
          data: availabilityUpdate,
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedBooking,
        message: `Booking ${notes.toLowerCase()} successfully`,
      });

    } catch (error: any) {
      console.error('Error updating booking status:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update booking status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // NEW: Request cancellation (special endpoint)
  static async requestCancellation(req: Request, res: Response) {
    try {
      const bookingId = parseInt(req.params.id);
      if (isNaN(bookingId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid booking ID',
        });
      }

      // Check if booking exists
      const existingBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!existingBooking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
        });
      }

      // Only allow cancellation request for certain statuses
      if (!['pending', 'confirmed'].includes(existingBooking.status)) {
        return res.status(400).json({
          success: false,
          error: `Cannot request cancellation for booking with status: ${existingBooking.status}`,
        });
      }

      // Update booking status to cancellation_requested
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'cancellation_requested',
        },
        include: {
          property: true,
          ownerAgent: true,
          bookingAgent: true,
        },
      });

      // Update availability notes
      await prisma.propertyAvailability.updateMany({
        where: { bookingId },
        data: {
          notes: 'Cancellation requested',
        },
      });

      return res.status(200).json({
        success: true,
        data: updatedBooking,
        message: 'Cancellation requested successfully. Waiting for property owner approval.',
      });

    } catch (error: any) {
      console.error('Error requesting cancellation:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to request cancellation',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Get bookings for specific property
  static async getPropertyBookings(req: Request, res: Response) {
    try {
      const propertyId = parseInt(req.params.propertyId);
      if (isNaN(propertyId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid property ID',
        });
      }

      const { startDate, endDate } = querySchema.parse(req.query);

      const where: any = {
        propertyId,
      };

      if (startDate || endDate) {
        where.checkIn = {};
        if (startDate) {
          where.checkIn.gte = new Date(startDate);
        }
        if (endDate) {
          where.checkIn.lte = new Date(endDate);
        }
      }

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          ownerAgent: true,
          bookingAgent: true,
          commission: true,
        },
        orderBy: {
          checkIn: 'asc',
        },
      });

      // Get property availability
      const availability = await prisma.propertyAvailability.findMany({
        where: {
          propertyId,
          startDate: startDate ? { gte: new Date(startDate) } : undefined,
          endDate: endDate ? { lte: new Date(endDate) } : undefined,
        },
        orderBy: {
          startDate: 'asc',
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          bookings,
          availability,
        },
      });

    } catch (error: any) {
      console.error('Error fetching property bookings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch property bookings',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Get agent's bookings
  static async getAgentBookings(req: Request, res: Response) {
    try {
      const agentId = parseInt(req.params.agentId);
      if (isNaN(agentId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid agent ID',
        });
      }

      const validationResult = querySchema.safeParse(req.query);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      const { status, startDate, endDate } = validationResult.data;

      const where: any = {
        OR: [
          { ownerAgentId: agentId },
          { bookingAgentId: agentId },
        ],
      };

      if (status) {
        where.status = status;
      }

      if (startDate || endDate) {
        where.checkIn = {};
        if (startDate) {
          where.checkIn.gte = new Date(startDate);
        }
        if (endDate) {
          where.checkIn.lte = new Date(endDate);
        }
      }

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          property: {
            include: {
              agency: true,
            },
          },
          commission: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calculate agent stats
      const stats = await prisma.booking.aggregate({
        where,
        _sum: {
          totalAmount: true,
        },
        _count: {
          id: true,
        },
      });

      // Get commission stats
      const commissionStats = await prisma.commission.aggregate({
        where: {
          OR: [
            { ownerAgentId: agentId },
            { bookingAgentId: agentId },
          ],
          status: 'paid',
        },
        _sum: {
          ownerCommission: true,
          bookingCommission: true,
        },
      });

      const totalCommission = 
        (commissionStats._sum.ownerCommission?.toNumber() || 0) +
        (commissionStats._sum.bookingCommission?.toNumber() || 0);

      return res.status(200).json({
        success: true,
        data: {
          bookings,
          stats: {
            totalBookings: stats._count.id,
            totalRevenue: stats._sum.totalAmount?.toNumber() || 0,
            totalCommission,
            ownerCommission: commissionStats._sum.ownerCommission?.toNumber() || 0,
            bookingCommission: commissionStats._sum.bookingCommission?.toNumber() || 0,
          },
        },
      });

    } catch (error: any) {
      console.error('Error fetching agent bookings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch agent bookings',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Get booking statistics
  static async getBookingStats(req: Request, res: Response) {
    try {
      const { agencyId, startDate, endDate } = querySchema.parse(req.query);

      const where: any = {};

      if (agencyId) {
        where.OR = [
          { property: { agencyId } },
          { ownerAgent: { agencyId } },
          { bookingAgent: { agencyId } },
        ];
      }

      if (startDate || endDate) {
        where.checkIn = {};
        if (startDate) {
          where.checkIn.gte = new Date(startDate);
        }
        if (endDate) {
          where.checkIn.lte = new Date(endDate);
        }
      }

      // Get overall stats
      const overallStats = await prisma.booking.aggregate({
        where,
        _sum: {
          totalAmount: true,
        },
        _count: {
          id: true,
        },
        _avg: {
          totalAmount: true,
        },
      });

      // Get status breakdown
      const statusStats = await prisma.booking.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true,
        },
        _sum: {
          totalAmount: true,
        },
      });

      // Get monthly trends
      const monthlyTrends = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "check_in") as month,
          COUNT(*) as booking_count,
          SUM(total_amount) as total_revenue
        FROM bookings
        ${agencyId ? Prisma.sql`WHERE EXISTS (
          SELECT 1 FROM properties p WHERE p.id = bookings.property_id AND p.agency_id = ${agencyId}
        )` : Prisma.sql``}
        ${startDate ? Prisma.sql`AND check_in >= ${new Date(startDate)}` : Prisma.sql``}
        ${endDate ? Prisma.sql`AND check_in <= ${new Date(endDate)}` : Prisma.sql``}
        GROUP BY DATE_TRUNC('month', "check_in")
        ORDER BY month DESC
        LIMIT 12
      `;

      // Get top properties
      const topProperties = await prisma.booking.groupBy({
        by: ['propertyId'],
        where,
        _count: {
          id: true,
        },
        _sum: {
          totalAmount: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      });

      // Get commission stats
      const commissionStats = await prisma.commission.aggregate({
        where: {
          ...where,
          status: 'paid',
        },
        _sum: {
          totalAmount: true,
          platformFee: true,
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          overall: {
            totalBookings: overallStats._count.id,
            totalRevenue: overallStats._sum.totalAmount?.toNumber() || 0,
            averageBookingValue: overallStats._avg.totalAmount?.toNumber() || 0,
          },
          statusBreakdown: statusStats.map(stat => ({
            status: stat.status,
            count: stat._count.id,
            revenue: stat._sum.totalAmount?.toNumber() || 0,
          })),
          monthlyTrends,
          topProperties: await Promise.all(
            topProperties.map(async (property) => {
              const propertyDetails = await prisma.property.findUnique({
                where: { id: property.propertyId },
                select: { title: true, location: true },
              });
              return {
                ...property,
                ...propertyDetails,
              };
            })
          ),
          commissions: {
            totalCommission: commissionStats._sum.totalAmount?.toNumber() || 0,
            platformEarnings: commissionStats._sum.platformFee?.toNumber() || 0,
            agentEarnings: (commissionStats._sum.totalAmount?.toNumber() || 0) - 
                         (commissionStats._sum.platformFee?.toNumber() || 0),
          },
        },
      });

    } catch (error: any) {
      console.error('Error fetching booking stats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch booking statistics',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // NEW: Get agency bookings (for agency admins)
  static async getAgencyBookings(req: Request, res: Response) {
    try {
      const agencyId = parseInt(req.params.agencyId);
      if (isNaN(agencyId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid agency ID',
        });
      }

      const validationResult = querySchema.safeParse(req.query);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      const {
        page = 1,
        limit = 20,
        status,
        startDate,
        endDate,
        search,
      } = validationResult.data;

      const skip = (page - 1) * limit;

      // Build where clause for agency bookings
      const where: any = {
        OR: [
          { property: { agencyId } },
          { ownerAgent: { agencyId } },
          { bookingAgent: { agencyId } },
        ],
      };

      if (status) {
        where.status = status;
      }

      if (startDate || endDate) {
        where.checkIn = {};
        if (startDate) {
          where.checkIn.gte = new Date(startDate);
        }
        if (endDate) {
          where.checkIn.lte = new Date(endDate);
        }
      }

      if (search) {
        where.OR = [
          ...where.OR,
          { clientName: { contains: search, mode: 'insensitive' } },
          { clientEmail: { contains: search, mode: 'insensitive' } },
          { property: { title: { contains: search, mode: 'insensitive' } } },
        ];
      }

      // Get total count
      const totalCount = await prisma.booking.count({ where });

      // Get agency bookings
      const bookings = await prisma.booking.findMany({
        where,
        include: {
          property: {
            include: {
              agency: true,
            },
          },
          ownerAgent: true,
          bookingAgent: true,
          commission: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      });

      // Calculate agency stats
      const stats = await prisma.booking.aggregate({
        where,
        _sum: {
          totalAmount: true,
        },
        _count: {
          id: true,
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          bookings,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: Math.ceil(totalCount / limit),
          },
          stats: {
            totalBookings: stats._count.id,
            totalRevenue: stats._sum.totalAmount?.toNumber() || 0,
          },
        },
      });

    } catch (error: any) {
      console.error('Error fetching agency bookings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch agency bookings',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // NEW: Get booking requests (pending bookings from other agencies)
  static async getBookingRequests(req: Request, res: Response) {
    try {
      const agentId = parseInt(req.params.agentId);
      if (isNaN(agentId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid agent ID',
        });
      }

      // Get current agent's agency
      const currentAgent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: { agency: true },
      });

      if (!currentAgent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
        });
      }

      // Get bookings where:
      // 1. Property is owned by current agent's agency
      // 2. Booking is pending or cancellation_requested
      // 3. Booking agent is from a different agency
      const bookings = await prisma.booking.findMany({
        where: {
          property: {
            agencyId: currentAgent.agencyId,
          },
          status: {
            in: ['pending', 'cancellation_requested'],
          },
          bookingAgent: {
            agencyId: {
              not: currentAgent.agencyId,
            },
          },
        },
        include: {
          property: {
            include: {
              agency: true,
            },
          },
          ownerAgent: {
            include: {
              agency: true,
            },
          },
          bookingAgent: {
            include: {
              agency: true,
            },
          },
          commission: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({
        success: true,
        data: bookings,
      });

    } catch (error: any) {
      console.error('Error fetching booking requests:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch booking requests',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

// Helper functions for email notifications (placeholder)
// const sendBookingConfirmationEmail = async (booking: any) => {
//   // Implement email sending logic
//   console.log('Sending booking confirmation email to:', booking.clientEmail);
// };

// const sendBookingConfirmedEmail = async (booking: any) => {
//   // Implement email sending logic
//   console.log('Sending booking confirmed email to:', booking.clientEmail);
// };