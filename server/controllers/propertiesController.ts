import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Create Property
 */
export const createProperty = async (req: Request, res: Response) => {
  try {
    const {
      agentId,
      title,
      description,
      location,
      propertyType,
      price,
      priceType,
      beds,
      baths,
      sqm,
      amenities,
      images,
      licenseNumber,
      status,
    } = req.body;

    const property = await prisma.property.create({
      data: {
        agentId,
        title,
        description,
        location,
        propertyType,
        price,
        priceType,
        beds,
        baths,
        sqm,
        amenities,
        images,
        licenseNumber,
        status,
      },
    });

    res.status(201).json(property);
  } catch (error) {
    res.status(500).json({ message: "Failed to create property", error });
  }
};

/**
 * Get All Properties (with filters)
 */
export const getProperties = async (req: Request, res: Response) => {
  try {
    const { location, minPrice, maxPrice, status, propertyType } = req.query;

    const properties = await prisma.property.findMany({
      where: {
        location: location ? String(location) : undefined,
        status: status ? String(status) : undefined,
        propertyType: propertyType ? String(propertyType) : undefined,
        price: {
          gte: minPrice ? Number(minPrice) : undefined,
          lte: maxPrice ? Number(maxPrice) : undefined,
        },
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch properties", error });
  }
};

/**
 * Get Single Property
 */
export const getPropertyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id: Number(id) },
      include: {
        agent: true,
        bookings: true,
        availability: true,
      },
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.json(property);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch property", error });
  }
};

/**
 * Update Property
 */
export const updateProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.update({
      where: { id: Number(id) },
      data: req.body,
    });

    res.json(property);
  } catch (error) {
    res.status(500).json({ message: "Failed to update property", error });
  }
};

/**
 * Delete Property
 */
export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.property.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete property", error });
  }
};

/**
 * Get Properties by Agent
 */
export const getAgentProperties = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    const properties = await prisma.property.findMany({
      where: { agentId: Number(agentId) },
      orderBy: { createdAt: "desc" },
    });

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch agent properties", error });
  }
};
