import { 
  type Agent, 
  type InsertAgent,
  type Property,
  type InsertProperty,
  type Booking,
  type InsertBooking,
  type Commission,
  type InsertCommission,
  agents,
  properties,
  bookings,
  commissions
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, ilike, or } from "drizzle-orm";

export interface IStorage {
  // Agent methods
  getAgent(id: number): Promise<Agent | undefined>;
  getAgentByEmail(email: string): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  
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
  
  // Commission methods
  getCommissionByBooking(bookingId: number): Promise<Commission | undefined>;
  getCommissionsByAgent(agentId: number): Promise<Commission[]>;
  createCommission(commission: InsertCommission): Promise<Commission>;
}

export class DatabaseStorage implements IStorage {
  // Agent methods
  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent || undefined;
  }

  async getAgentByEmail(email: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.email, email));
    return agent || undefined;
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const [agent] = await db.insert(agents).values(insertAgent).returning();
    return agent;
  }

  // Property methods
  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
  }

  async getPropertiesByAgent(agentId: number): Promise<Property[]> {
    return await db.select().from(properties).where(eq(properties.agentId, agentId));
  }

  async getAllProperties(filters?: {
    location?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
  }): Promise<Property[]> {
    let query = db.select().from(properties);
    
    const conditions = [];
    
    if (filters?.location) {
      conditions.push(ilike(properties.location, `%${filters.location}%`));
    }
    if (filters?.propertyType) {
      conditions.push(eq(properties.propertyType, filters.propertyType));
    }
    if (filters?.status) {
      conditions.push(eq(properties.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db.insert(properties).values(property).returning();
    return newProperty;
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const [updated] = await db
      .update(properties)
      .set({ ...property, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProperty(id: number): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }

  // Booking methods
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getBookingsByProperty(propertyId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.propertyId, propertyId));
  }

  async getBookingsByAgent(agentId: number): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(
        or(
          eq(bookings.ownerAgentId, agentId),
          eq(bookings.bookingAgentId, agentId)
        )
      );
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const [updated] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return updated || undefined;
  }

  // Commission methods
  async getCommissionByBooking(bookingId: number): Promise<Commission | undefined> {
    const [commission] = await db.select().from(commissions).where(eq(commissions.bookingId, bookingId));
    return commission || undefined;
  }

  async getCommissionsByAgent(agentId: number): Promise<Commission[]> {
    return await db
      .select()
      .from(commissions)
      .where(
        or(
          eq(commissions.ownerAgentId, agentId),
          eq(commissions.bookingAgentId, agentId)
        )
      );
  }

  async createCommission(commission: InsertCommission): Promise<Commission> {
    const [newCommission] = await db.insert(commissions).values(commission).returning();
    return newCommission;
  }
}

export const storage = new DatabaseStorage();
