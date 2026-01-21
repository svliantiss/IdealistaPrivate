import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import Decimal from 'decimal.js';

import { prisma } from "../db";

function convertToMonths(value: number, unit: string) {
  switch (unit) {
    case 'days':
      return value / 30;   // approximate
    case 'weeks':
      return value / 4;    // approximate
    case 'months':
      return value;
    case 'years':
      return value * 12;
    default:
      return 0;
  }
}

export class PropertiesController {
  // ==========================
  // RENTAL PROPERTIES
  // ==========================

  // Get all rental properties (with filtering)
  async getRentalProperties(req: Request, res: Response) {
    try {
      const {
        agencyId,
        status,
        propertyType,
        minPrice,
        maxPrice,
        location,
        beds,
        agentId,
        search,
        page = 1,
        limit = 10
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (agencyId) where.agencyId = Number(agencyId);
      if (status) where.status = status;
      if (propertyType) where.propertyType = propertyType;
      if (agentId) where.createdById = Number(agentId);
      if (location) where.location = { contains: location, mode: 'insensitive' };
      if (beds) where.beds = { gte: Number(beds) };

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
          { location: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = new Decimal(minPrice as string);
        if (maxPrice) where.price.lte = new Decimal(maxPrice as string);
      }

      const [properties, total] = await Promise.all([
        prisma.property.findMany({
          where,
          include: {
            agency: {
              select: { name: true, logo: true }
            },
            createdBy: {
              select: { name: true, email: true, phone: true }
            },
            availability: {
              where: { isAvailable: true },
              orderBy: { startDate: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.property.count({ where })
      ]);

      res.json({
        success: true,
        data: properties,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching rental properties:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch properties' });
    }
  }

  // Get single rental property
  async getRentalProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const property = await prisma.property.findUnique({
        where: { id: Number(id) },
        include: {
          agency: true,
          createdBy: {
            select: { id: true, name: true, email: true, phone: true }
          },
          bookings: {
            include: {
              ownerAgent: true,
              bookingAgent: true
            }
          },
          availability: true
        }
      });

      if (!property) {
        return res.status(404).json({ success: false, error: 'Property not found' });
      }

      res.json({ success: true, data: property });
    } catch (error) {
      console.error('Error fetching property:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch property' });
    }
  }

  // Create rental property
  async createRentalProperty(req: Request, res: Response) {
    try {
      const {
        minimumStayDuration,
        agencyId,
        createdById,
        title,
        description,
        location,
        propertyType,
        price,
        priceType,
        beds,
        baths,
        minimumStayValue,
        minimumStayUnit,
        sqm,
        amenities,
        media,
        licenseNumber
      } = req.body;


      // Validate required fields
      if (!agencyId || !createdById || !title || !location || !propertyType || !price) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }


      const existingAgency = await prisma.agency.findUnique({
        where: { id: agencyId }
      });

      if (!existingAgency) {
        return res.status(404).json({ success: false, error: 'Agency with Your ID does not exist' });
      }

      // Convert to months for classification
      const months = convertToMonths(Number(minimumStayValue), minimumStayUnit);
      const classification = months >= 3 ? 'Long-Term' : 'Short-Term';


      const property = await prisma.property.create({
        data: {
          agencyId: Number(agencyId),
          createdById: Number(createdById),
          title,
          description,
          location,
          minimumStayValue: Number(minimumStayValue),
          minimumStayUnit,
          classification,
          propertyType,
          price: new Decimal(price),
          priceType: priceType || 'night',
          beds: Number(beds) || 0,
          baths: Number(baths) || 0,
          sqm: Number(sqm) || 0,
          amenities: amenities || [],
          media: media || [],
          licenseNumber,
          status: 'draft'
        },
        include: {
          agency: {
            select: { name: true }
          },
          createdBy: {
            select: { name: true, email: true }
          }
        }
      });

      res.status(201).json({ success: true, data: property });
    } catch (error) {
      console.error('Error creating property:', error);
      res.status(500).json({ success: false, error: 'Failed to create property' });
    }
  }

  // Update rental property
  async updateRentalProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Convert price to Decimal if present
      if (updates.price) {
        updates.price = new Decimal(updates.price);
      }

      // Recalculate classification if minimum stay is updated
      if (updates.minimumStayValue !== undefined && updates.minimumStayUnit) {
        const months = convertToMonths(Number(updates.minimumStayValue), updates.minimumStayUnit);
        updates.classification = months >= 3 ? 'Long-Term' : 'Short-Term';
      }


      // Remove fields that shouldn't be updated directly
      delete updates.id;
      delete updates.createdAt;
      delete updates.agencyId;
      delete updates.createdById;

      const property = await prisma.property.update({
        where: { id: Number(id) },
        data: updates,
        include: {
          agency: {
            select: { name: true }
          },
          createdBy: {
            select: { name: true }
          }
        }
      });

      res.json({ success: true, data: property });
    } catch (error) {
      console.error('Error updating property:', error);

      if (error) {
        return res.status(404).json({ success: false, error: 'Property not found' });
      }

      res.status(500).json({ success: false, error: 'Failed to update property' });
    }
  }

  // Update property status
  async updatePropertyStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['draft', 'published', 'archived'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }

      const property = await prisma.property.update({
        where: { id: Number(id) },
        data: { status },
        select: { id: true, title: true, status: true }
      });

      res.json({ success: true, data: property });
    } catch (error) {
      console.error('Error updating property status:', error);
      res.status(500).json({ success: false, error: 'Failed to update status' });
    }
  }

  // Delete rental property
  async deleteRentalProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if property has bookings
      const bookings = await prisma.booking.count({
        where: { propertyId: Number(id) }
      });

      if (bookings > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete property with existing bookings. Archive it instead.'
        });
      }

      // Delete related availability records
      await prisma.propertyAvailability.deleteMany({
        where: { propertyId: Number(id) }
      });

      await prisma.property.delete({
        where: { id: Number(id) }
      });

      res.json({ success: true, message: 'Property deleted successfully' });
    } catch (error) {
      console.error('Error deleting property:', error);
      res.status(500).json({ success: false, error: 'Failed to delete property' });
    }
  }

  // ==========================
  // SALES PROPERTIES
  // ==========================

  // Get all sales properties
  async getSalesProperties(req: Request, res: Response) {
    try {
      const {
        agencyId,
        status,
        propertyType,
        minPrice,
        maxPrice,
        agentId,
        search,
        page = 1,
        limit = 10
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (agencyId) where.agencyId = Number(agencyId);
      if (status) where.status = status;
      if (propertyType) where.propertyType = propertyType;
      if (agentId) where.agentId = Number(agentId);

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
          { location: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = new Decimal(minPrice as string);
        if (maxPrice) where.price.lte = new Decimal(maxPrice as string);
      }

      const [properties, total] = await Promise.all([
        prisma.salesProperty.findMany({
          where,
          include: {
            agency: {
              select: { name: true, logo: true }
            },
            agent: {
              select: { name: true, email: true, phone: true }
            },
            transactions: {
              select: { id: true, saleDate: true, status: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.salesProperty.count({ where })
      ]);

      res.json({
        success: true,
        data: properties,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching sales properties:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch sales properties' });
    }
  }

  // Create sales property
  async createSalesProperty(req: Request, res: Response) {
    try {
      const {
        agencyId,
        agentId,
        title,
        description,
        location,
        propertyType,
        price,
        beds,
        baths,
        sqm,
        amenities,
        media
      } = req.body;

      if (!agencyId || !agentId || !title || !location || !propertyType || !price) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      const property = await prisma.salesProperty.create({
        data: {
          agencyId: Number(agencyId),
          agentId: Number(agentId),
          title,
          description,
          location,
          propertyType,
          price: new Decimal(price),
          beds: Number(beds) || 0,
          baths: Number(baths) || 0,
          sqm: Number(sqm) || 0,
          amenities: amenities || [],
          media: media || [],
          status: 'draft'
        },
        include: {
          agency: { select: { name: true } },
          agent: { select: { name: true, email: true } }
        }
      });

      res.status(201).json({ success: true, data: property });
    } catch (error) {
      console.error('Error creating sales property:', error);
      res.status(500).json({ success: false, error: 'Failed to create sales property' });
    }
  }

  // ==========================
  // PROPERTY AVAILABILITY
  // ==========================

  // Get property availability
  async getPropertyAvailability(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const { startDate, endDate } = req.query;

      const where: any = {
        propertyId: Number(propertyId)
      };

      if (startDate && endDate) {
        where.OR = [
          {
            startDate: { lte: new Date(endDate as string) },
            endDate: { gte: new Date(startDate as string) }
          }
        ];
      }

      const availability = await prisma.propertyAvailability.findMany({
        where,
        include: {
          booking: {
            select: { clientName: true, checkIn: true, checkOut: true, status: true }
          }
        },
        orderBy: { startDate: 'asc' }
      });

      res.json({ success: true, data: availability });
    } catch (error) {
      console.error('Error fetching availability:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch availability' });
    }
  }

  // Update property availability
  async updatePropertyAvailability(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const { startDate, endDate, isAvailable, notes } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, error: 'Start and end dates required' });
      }

      // Check for overlapping bookings
      const overlapping = await prisma.propertyAvailability.findFirst({
        where: {
          propertyId: Number(propertyId),
          startDate: { lte: new Date(endDate) },
          endDate: { gte: new Date(startDate) },
          isAvailable: false,
          bookingId: { not: null }
        }
      });

      if (overlapping && isAvailable === false) {
        return res.status(400).json({
          success: false,
          error: 'Dates overlap with existing booking'
        });
      }

      const availability = await prisma.propertyAvailability.create({
        data: {
          propertyId: Number(propertyId),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isAvailable: isAvailable !== false,
          notes
        }
      });

      res.status(201).json({ success: true, data: availability });
    } catch (error) {
      console.error('Error updating availability:', error);
      res.status(500).json({ success: false, error: 'Failed to update availability' });
    }
  }

  // ==========================
  // DASHBOARD & STATISTICS
  // ==========================

  // Get property statistics for agency
  async getPropertyStats(req: Request, res: Response) {
    try {
      const { agencyId } = req.params;

      const [
        totalProperties,
        publishedProperties,
        totalBookings,
        totalRevenue,
        recentProperties
      ] = await Promise.all([
        prisma.property.count({ where: { agencyId: Number(agencyId) } }),
        prisma.property.count({ where: { agencyId: Number(agencyId), status: 'published' } }),
        prisma.booking.count({
          where: {
            property: { agencyId: Number(agencyId) },
            status: 'confirmed'
          }
        }),
        prisma.booking.aggregate({
          where: {
            property: { agencyId: Number(agencyId) },
            status: 'confirmed'
          },
          _sum: { totalAmount: true }
        }),
        prisma.property.findMany({
          where: { agencyId: Number(agencyId) },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            status: true,
            price: true,
            createdAt: true,
            bookings: {
              select: { id: true, status: true },
              take: 5
            }
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalProperties,
          publishedProperties,
          totalBookings,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          recentProperties
        }
      });
    } catch (error) {
      console.error('Error fetching property stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
    }
  }

  // ==========================
  // BULK OPERATIONS
  // ==========================

  // Bulk update property status
  async bulkUpdatePropertyStatus(req: Request, res: Response) {
    try {
      const { propertyIds, status } = req.body;

      if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
        return res.status(400).json({ success: false, error: 'No properties specified' });
      }

      if (!['draft', 'published', 'archived'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }

      const result = await prisma.property.updateMany({
        where: { id: { in: propertyIds.map(id => Number(id)) } },
        data: { status }
      });

      res.json({
        success: true,
        message: `Updated ${result.count} properties to ${status} status`
      });
    } catch (error) {
      console.error('Error bulk updating properties:', error);
      res.status(500).json({ success: false, error: 'Failed to update properties' });
    }
  }
  // Get single sales property
  async getSalesProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const property = await prisma.salesProperty.findUnique({
        where: { id: Number(id) },
        include: {
          agency: true,
          agent: {
            select: { id: true, name: true, email: true, phone: true }
          },
        }
      });

      if (!property) {
        return res.status(404).json({ success: false, error: 'Sales property not found' });
      }

      res.json({ success: false, data: property });
    } catch (error) {
      console.error('Error fetching sales property:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch sales property' });
    }
  }
}



export default new PropertiesController();