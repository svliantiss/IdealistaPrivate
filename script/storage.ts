import { 
  type Agent, 
  type InsertAgent,
  type Property,
  type InsertProperty,
  type Booking,
  type InsertBooking,
  type Commission,
  type InsertCommission,
  type SalesProperty,
  type InsertSalesProperty,
  type SalesTransaction,
  type InsertSalesTransaction,
  type SalesCommission,
  type InsertSalesCommission,
  type PropertyAvailability,
  type InsertPropertyAvailability,
  type AgentAmenity,
  type InsertAgentAmenity,
} from "@shared/schema";
import { prisma } from "./db";

export interface IStorage {
  // Agent methods
  getAgent(id: number): Promise<Agent | undefined>;
  getAgentByEmail(email: string): Promise<Agent | undefined>;
  getAllAgents(): Promise<Agent[]>;
  getAgentsByAgency(agency: string): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  deleteAgent(id: number): Promise<void>;
  
  // Property methods
  getProperty(id: number): Promise<Property | undefined>;
  getPropertiesByAgent(agentId: number): Promise<Property[]>;
  getAllProperties(filters?: {
    location?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
  }): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<void>;
  
  // Booking methods
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByProperty(propertyId: number): Promise<Booking[]>;
  getBookingsByAgent(agentId: number): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
  archivePastBookings(): Promise<number>;
  
  // Commission methods
  getCommissionByBooking(bookingId: number): Promise<Commission | undefined>;
  getCommissionsByAgent(agentId: number): Promise<Commission[]>;
  createCommission(commission: InsertCommission): Promise<Commission>;

  // Sales Property methods
  getSalesProperty(id: number): Promise<SalesProperty | undefined>;
  getSalesPropertiesByAgent(agentId: number): Promise<SalesProperty[]>;
  getAllSalesProperties(filters?: {
    location?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
  }): Promise<SalesProperty[]>;
  createSalesProperty(property: InsertSalesProperty): Promise<SalesProperty>;
  updateSalesProperty(id: number, property: Partial<InsertSalesProperty>): Promise<SalesProperty | undefined>;
  deleteSalesProperty(id: number): Promise<void>;

  // Sales Transaction methods
  getSalesTransaction(id: number): Promise<SalesTransaction | undefined>;
  getSalesTransactionsByAgent(agentId: number): Promise<SalesTransaction[]>;
  createSalesTransaction(transaction: InsertSalesTransaction): Promise<SalesTransaction>;
  updateSalesTransactionStatus(id: number, status: string): Promise<SalesTransaction | undefined>;

  // Sales Commission methods
  getSalesCommissionsByAgent(agentId: number): Promise<SalesCommission[]>;
  createSalesCommission(commission: InsertSalesCommission): Promise<SalesCommission>;

  // Property Availability methods
  getPropertyAvailability(propertyId: number): Promise<PropertyAvailability[]>;
  getAllPropertyAvailability(): Promise<PropertyAvailability[]>;
  createPropertyAvailability(availability: InsertPropertyAvailability): Promise<PropertyAvailability>;
  updatePropertyAvailability(id: number, availability: Partial<InsertPropertyAvailability>): Promise<PropertyAvailability | undefined>;
  deletePropertyAvailability(id: number): Promise<void>;
  deletePropertyAvailabilityByDates(propertyId: number, startDate: Date, endDate: Date): Promise<void>;

  // Agent Amenities methods
  getAgentAmenities(agentId: number): Promise<AgentAmenity[]>;
  createAgentAmenity(amenity: InsertAgentAmenity): Promise<AgentAmenity>;
  deleteAgentAmenity(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Agent methods
  async getAgent(id: number): Promise<Agent | undefined> {
    const agent = await prisma.agent.findUnique({
      where: { id },
    });
    return agent || undefined;
  }

  async getAgentByEmail(email: string): Promise<Agent | undefined> {
    const agent = await prisma.agent.findUnique({
      where: { email },
    });
    return agent || undefined;
  }

  async getAllAgents(): Promise<Agent[]> {
    return await prisma.agent.findMany();
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    return await prisma.agent.create({
      data: insertAgent,
    });
  }

  async getAgentsByAgency(agency: string): Promise<Agent[]> {
    return await prisma.agent.findMany({
      where: { agency },
    });
  }

  async deleteAgent(id: number): Promise<void> {
    await prisma.agent.delete({
      where: { id },
    });
  }

  // Property methods
  async getProperty(id: number): Promise<Property | undefined> {
    const property = await prisma.property.findUnique({
      where: { id },
    });
    return property || undefined;
  }

  async getPropertiesByAgent(agentId: number): Promise<Property[]> {
    return await prisma.property.findMany({
      where: { agentId },
    });
  }

  async getAllProperties(filters?: {
    location?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
  }): Promise<Property[]> {
    const where: any = {};
    
    if (filters?.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }
    if (filters?.propertyType) {
      where.propertyType = filters.propertyType;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    
    return await prisma.property.findMany({ where });
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    return await prisma.property.create({
      data: property,
    });
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    try {
      const updated = await prisma.property.update({
        where: { id },
        data: { ...property, updatedAt: new Date() },
      });
      return updated;
    } catch {
      return undefined;
    }
  }

  async deleteProperty(id: number): Promise<void> {
    await prisma.property.delete({
      where: { id },
    });
  }

  // Booking methods
  async getBooking(id: number): Promise<Booking | undefined> {
    const booking = await prisma.booking.findUnique({
      where: { id },
    });
    return booking || undefined;
  }

  async getBookingsByProperty(propertyId: number): Promise<Booking[]> {
    return await prisma.booking.findMany({
      where: { propertyId },
    });
  }

  async getBookingsByAgent(agentId: number): Promise<Booking[]> {
    return await prisma.booking.findMany({
      where: {
        OR: [
          { ownerAgentId: agentId },
          { bookingAgentId: agentId },
        ],
      },
    });
  }

  async getAllBookings(): Promise<Booking[]> {
    return await prisma.booking.findMany();
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    return await prisma.booking.create({
      data: booking,
    });
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    try {
      const updated = await prisma.booking.update({
        where: { id },
        data: { status },
      });
      return updated;
    } catch {
      return undefined;
    }
  }

  async archivePastBookings(): Promise<number> {
    const now = new Date();
    const allBookings = await prisma.booking.findMany();
    let archivedCount = 0;
    
    for (const booking of allBookings) {
      const checkOutDate = new Date(booking.checkOut);
      const isPast = checkOutDate < now;
      const shouldArchive = isPast && ['pending', 'confirmed', 'paid'].includes(booking.status);
      
      if (shouldArchive) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'archived' },
        });
        archivedCount++;
      }
    }
    
    return archivedCount;
  }

  // Commission methods
  async getCommissionByBooking(bookingId: number): Promise<Commission | undefined> {
    const commission = await prisma.commission.findUnique({
      where: { bookingId },
    });
    return commission || undefined;
  }

  async getCommissionsByAgent(agentId: number): Promise<Commission[]> {
    return await prisma.commission.findMany({
      where: {
        OR: [
          { ownerAgentId: agentId },
          { bookingAgentId: agentId },
        ],
      },
    });
  }

  async createCommission(commission: InsertCommission): Promise<Commission> {
    return await prisma.commission.create({
      data: commission,
    });
  }

  // Sales Property methods
  async getSalesProperty(id: number): Promise<SalesProperty | undefined> {
    const property = await prisma.salesProperty.findUnique({
      where: { id },
    });
    return property || undefined;
  }

  async getSalesPropertiesByAgent(agentId: number): Promise<SalesProperty[]> {
    return await prisma.salesProperty.findMany({
      where: { agentId },
    });
  }

  async getAllSalesProperties(filters?: {
    location?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
  }): Promise<SalesProperty[]> {
    const where: any = {};
    
    if (filters?.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }
    if (filters?.propertyType) {
      where.propertyType = filters.propertyType;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    
    return await prisma.salesProperty.findMany({ where });
  }

  async createSalesProperty(property: InsertSalesProperty): Promise<SalesProperty> {
    return await prisma.salesProperty.create({
      data: property,
    });
  }

  async updateSalesProperty(id: number, property: Partial<InsertSalesProperty>): Promise<SalesProperty | undefined> {
    try {
      const updated = await prisma.salesProperty.update({
        where: { id },
        data: { ...property, updatedAt: new Date() },
      });
      return updated;
    } catch {
      return undefined;
    }
  }

  async deleteSalesProperty(id: number): Promise<void> {
    await prisma.salesProperty.delete({
      where: { id },
    });
  }

  // Sales Transaction methods
  async getSalesTransaction(id: number): Promise<SalesTransaction | undefined> {
    const transaction = await prisma.salesTransaction.findUnique({
      where: { id },
    });
    return transaction || undefined;
  }

  async getSalesTransactionsByAgent(agentId: number): Promise<SalesTransaction[]> {
    return await prisma.salesTransaction.findMany({
      where: {
        OR: [
          { sellerAgentId: agentId },
          { buyerAgentId: agentId },
        ],
      },
    });
  }

  async createSalesTransaction(transaction: InsertSalesTransaction): Promise<SalesTransaction> {
    return await prisma.salesTransaction.create({
      data: transaction,
    });
  }

  async updateSalesTransactionStatus(id: number, status: string): Promise<SalesTransaction | undefined> {
    try {
      const updated = await prisma.salesTransaction.update({
        where: { id },
        data: { status },
      });
      return updated;
    } catch {
      return undefined;
    }
  }

  // Sales Commission methods
  async getSalesCommissionsByAgent(agentId: number): Promise<SalesCommission[]> {
    return await prisma.salesCommission.findMany({
      where: {
        OR: [
          { sellerAgentId: agentId },
          { buyerAgentId: agentId },
        ],
      },
    });
  }

  async createSalesCommission(commission: InsertSalesCommission): Promise<SalesCommission> {
    return await prisma.salesCommission.create({
      data: commission,
    });
  }

  // Property Availability methods
  async getPropertyAvailability(propertyId: number): Promise<PropertyAvailability[]> {
    return await prisma.propertyAvailability.findMany({
      where: { propertyId },
    });
  }

  async getAllPropertyAvailability(): Promise<PropertyAvailability[]> {
    return await prisma.propertyAvailability.findMany();
  }

  async createPropertyAvailability(availability: InsertPropertyAvailability): Promise<PropertyAvailability> {
    return await prisma.propertyAvailability.create({
      data: availability,
    });
  }

  async updatePropertyAvailability(id: number, availability: Partial<InsertPropertyAvailability>): Promise<PropertyAvailability | undefined> {
    try {
      const updated = await prisma.propertyAvailability.update({
        where: { id },
        data: availability,
      });
      return updated;
    } catch {
      return undefined;
    }
  }

  async deletePropertyAvailability(id: number): Promise<void> {
    await prisma.propertyAvailability.delete({
      where: { id },
    });
  }

  async deletePropertyAvailabilityByDates(propertyId: number, startDate: Date, endDate: Date): Promise<void> {
    const allAvailability = await prisma.propertyAvailability.findMany({
      where: { propertyId },
    });
    
    // Normalize target dates to date-only strings for comparison
    const targetStart = new Date(startDate).toISOString().split('T')[0];
    const targetEnd = new Date(endDate).toISOString().split('T')[0];
    
    for (const record of allAvailability) {
      // Normalize record dates to date-only strings
      const recordStart = new Date(record.startDate).toISOString().split('T')[0];
      const recordEnd = new Date(record.endDate).toISOString().split('T')[0];
      
      // Only delete if exact date match (this availability was created specifically for this booking)
      if (recordStart === targetStart && recordEnd === targetEnd) {
        await prisma.propertyAvailability.delete({
          where: { id: record.id },
        });
        break; // Found and deleted the specific record, no need to continue
      }
    }
  }

  // Agent Amenities methods
  async getAgentAmenities(agentId: number): Promise<AgentAmenity[]> {
    return await prisma.agentAmenity.findMany({
      where: { agentId },
    });
  }

  async createAgentAmenity(amenity: InsertAgentAmenity): Promise<AgentAmenity> {
    return await prisma.agentAmenity.create({
      data: amenity,
    });
  }

  async deleteAgentAmenity(id: number): Promise<void> {
    await prisma.agentAmenity.delete({
      where: { id },
    });
  }
}

export const storage = new DatabaseStorage();
