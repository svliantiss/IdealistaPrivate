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
  agents,
  properties,
  bookings,
  commissions,
  salesProperties,
  salesTransactions,
  salesCommissions,
  propertyAvailability
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, ilike, or } from "drizzle-orm";

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

  async getAllAgents(): Promise<Agent[]> {
    return await db.select().from(agents);
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const [agent] = await db.insert(agents).values(insertAgent).returning();
    return agent;
  }

  async getAgentsByAgency(agency: string): Promise<Agent[]> {
    return await db.select().from(agents).where(eq(agents.agency, agency));
  }

  async deleteAgent(id: number): Promise<void> {
    await db.delete(agents).where(eq(agents.id, id));
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

  // Sales Property methods
  async getSalesProperty(id: number): Promise<SalesProperty | undefined> {
    const [property] = await db.select().from(salesProperties).where(eq(salesProperties.id, id));
    return property || undefined;
  }

  async getSalesPropertiesByAgent(agentId: number): Promise<SalesProperty[]> {
    return await db.select().from(salesProperties).where(eq(salesProperties.agentId, agentId));
  }

  async getAllSalesProperties(filters?: {
    location?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
  }): Promise<SalesProperty[]> {
    let query = db.select().from(salesProperties);
    const conditions = [];
    
    if (filters?.location) {
      conditions.push(ilike(salesProperties.location, `%${filters.location}%`));
    }
    if (filters?.propertyType) {
      conditions.push(eq(salesProperties.propertyType, filters.propertyType));
    }
    if (filters?.status) {
      conditions.push(eq(salesProperties.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query;
  }

  async createSalesProperty(property: InsertSalesProperty): Promise<SalesProperty> {
    const [newProperty] = await db.insert(salesProperties).values(property).returning();
    return newProperty;
  }

  async updateSalesProperty(id: number, property: Partial<InsertSalesProperty>): Promise<SalesProperty | undefined> {
    const [updated] = await db
      .update(salesProperties)
      .set({ ...property, updatedAt: new Date() })
      .where(eq(salesProperties.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSalesProperty(id: number): Promise<void> {
    await db.delete(salesProperties).where(eq(salesProperties.id, id));
  }

  // Sales Transaction methods
  async getSalesTransaction(id: number): Promise<SalesTransaction | undefined> {
    const [transaction] = await db.select().from(salesTransactions).where(eq(salesTransactions.id, id));
    return transaction || undefined;
  }

  async getSalesTransactionsByAgent(agentId: number): Promise<SalesTransaction[]> {
    return await db.select().from(salesTransactions).where(
      or(
        eq(salesTransactions.sellerAgentId, agentId),
        eq(salesTransactions.buyerAgentId, agentId)
      )
    );
  }

  async createSalesTransaction(transaction: InsertSalesTransaction): Promise<SalesTransaction> {
    const [result] = await db.insert(salesTransactions).values(transaction).returning();
    return result;
  }

  async updateSalesTransactionStatus(id: number, status: string): Promise<SalesTransaction | undefined> {
    const [updated] = await db
      .update(salesTransactions)
      .set({ status })
      .where(eq(salesTransactions.id, id))
      .returning();
    return updated || undefined;
  }

  // Sales Commission methods
  async getSalesCommissionsByAgent(agentId: number): Promise<SalesCommission[]> {
    return await db.select().from(salesCommissions).where(
      or(
        eq(salesCommissions.sellerAgentId, agentId),
        eq(salesCommissions.buyerAgentId, agentId)
      )
    );
  }

  async createSalesCommission(commission: InsertSalesCommission): Promise<SalesCommission> {
    const [result] = await db.insert(salesCommissions).values(commission).returning();
    return result;
  }

  // Property Availability methods
  async getPropertyAvailability(propertyId: number): Promise<PropertyAvailability[]> {
    return await db.select().from(propertyAvailability).where(eq(propertyAvailability.propertyId, propertyId));
  }

  async getAllPropertyAvailability(): Promise<PropertyAvailability[]> {
    return await db.select().from(propertyAvailability);
  }

  async createPropertyAvailability(availability: InsertPropertyAvailability): Promise<PropertyAvailability> {
    const [result] = await db.insert(propertyAvailability).values(availability).returning();
    return result;
  }

  async updatePropertyAvailability(id: number, availability: Partial<InsertPropertyAvailability>): Promise<PropertyAvailability | undefined> {
    const [updated] = await db
      .update(propertyAvailability)
      .set(availability)
      .where(eq(propertyAvailability.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePropertyAvailability(id: number): Promise<void> {
    await db.delete(propertyAvailability).where(eq(propertyAvailability.id, id));
  }

  async deletePropertyAvailabilityByDates(propertyId: number, startDate: Date, endDate: Date): Promise<void> {
    const allAvailability = await db.select().from(propertyAvailability).where(
      eq(propertyAvailability.propertyId, propertyId)
    );
    
    // Normalize target dates to date-only strings for comparison
    const targetStart = new Date(startDate).toISOString().split('T')[0];
    const targetEnd = new Date(endDate).toISOString().split('T')[0];
    
    for (const record of allAvailability) {
      // Normalize record dates to date-only strings
      const recordStart = new Date(record.startDate).toISOString().split('T')[0];
      const recordEnd = new Date(record.endDate).toISOString().split('T')[0];
      
      // Only delete if exact date match (this availability was created specifically for this booking)
      if (recordStart === targetStart && recordEnd === targetEnd) {
        await db.delete(propertyAvailability).where(eq(propertyAvailability.id, record.id));
        break; // Found and deleted the specific record, no need to continue
      }
    }
  }
}

export const storage = new DatabaseStorage();
