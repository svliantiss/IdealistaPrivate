import { prisma } from "./db";
import type { Agent, InsertAgent, Property, InsertProperty, Booking, InsertBooking, EmailOtp, InsertEmailOtp, Commission, InsertCommission, SalesProperty, InsertSalesProperty, SalesTransaction, InsertSalesTransaction, SalesCommission, InsertSalesCommission, PropertyAvailability, InsertPropertyAvailability, AgentAmenity, InsertAgentAmenity } from "@shared/schema";

export interface IStorage {
  getAgent(id: number): Promise<Agent | undefined>;
  getAllAgents(): Promise<Agent[]>;
  createAgent(data: InsertAgent): Promise<Agent>;
  deleteAgent(id: number): Promise<void>;

  getProperty(id: number): Promise<Property | undefined>;
  getAllPropertys(): Promise<Property[]>;
  createProperty(data: InsertProperty): Promise<Property>;
  deleteProperty(id: number): Promise<void>;

  getBooking(id: number): Promise<Booking | undefined>;
  getAllBookings(): Promise<Booking[]>;
  createBooking(data: InsertBooking): Promise<Booking>;
  deleteBooking(id: number): Promise<void>;

  getEmailOtp(id: number): Promise<EmailOtp | undefined>;
  getAllEmailOtps(): Promise<EmailOtp[]>;
  createEmailOtp(data: InsertEmailOtp): Promise<EmailOtp>;
  deleteEmailOtp(id: number): Promise<void>;

  getCommission(id: number): Promise<Commission | undefined>;
  getAllCommissions(): Promise<Commission[]>;
  createCommission(data: InsertCommission): Promise<Commission>;
  deleteCommission(id: number): Promise<void>;

  getSalesProperty(id: number): Promise<SalesProperty | undefined>;
  getAllSalesPropertys(): Promise<SalesProperty[]>;
  createSalesProperty(data: InsertSalesProperty): Promise<SalesProperty>;
  deleteSalesProperty(id: number): Promise<void>;

  getSalesTransaction(id: number): Promise<SalesTransaction | undefined>;
  getAllSalesTransactions(): Promise<SalesTransaction[]>;
  createSalesTransaction(data: InsertSalesTransaction): Promise<SalesTransaction>;
  deleteSalesTransaction(id: number): Promise<void>;

  getSalesCommission(id: number): Promise<SalesCommission | undefined>;
  getAllSalesCommissions(): Promise<SalesCommission[]>;
  createSalesCommission(data: InsertSalesCommission): Promise<SalesCommission>;
  deleteSalesCommission(id: number): Promise<void>;

  getPropertyAvailability(id: number): Promise<PropertyAvailability | undefined>;
  getAllPropertyAvailabilitys(): Promise<PropertyAvailability[]>;
  createPropertyAvailability(data: InsertPropertyAvailability): Promise<PropertyAvailability>;
  deletePropertyAvailability(id: number): Promise<void>;

  getAgentAmenity(id: number): Promise<AgentAmenity | undefined>;
  getAllAgentAmenitys(): Promise<AgentAmenity[]>;
  createAgentAmenity(data: InsertAgentAmenity): Promise<AgentAmenity>;
  deleteAgentAmenity(id: number): Promise<void>;

}

export class DatabaseStorage implements IStorage {

  async getAgent(id: number): Promise<Agent | undefined> {
    return await prisma.agent.findUnique({ where: { id } }) || undefined;
  }

  async getAllAgents(): Promise<Agent[]> {
    return await prisma.agent.findMany();
  }

  async createAgent(data: InsertAgent): Promise<Agent> {
    return await prisma.agent.create({ data });
  }

  async deleteAgent(id: number): Promise<void> {
    await prisma.agent.delete({ where: { id } });
  }

  async getProperty(id: number): Promise<Property | undefined> {
    return await prisma.property.findUnique({ where: { id } }) || undefined;
  }

  async getAllPropertys(): Promise<Property[]> {
    return await prisma.property.findMany();
  }

  async createProperty(data: InsertProperty): Promise<Property> {
    return await prisma.property.create({ data });
  }

  async deleteProperty(id: number): Promise<void> {
    await prisma.property.delete({ where: { id } });
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    return await prisma.booking.findUnique({ where: { id } }) || undefined;
  }

  async getAllBookings(): Promise<Booking[]> {
    return await prisma.booking.findMany();
  }

  async createBooking(data: InsertBooking): Promise<Booking> {
    return await prisma.booking.create({ data });
  }

  async deleteBooking(id: number): Promise<void> {
    await prisma.booking.delete({ where: { id } });
  }

  async getEmailOtp(id: number): Promise<EmailOtp | undefined> {
    return await prisma.emailOtp.findUnique({ where: { id } }) || undefined;
  }

  async getAllEmailOtps(): Promise<EmailOtp[]> {
    return await prisma.emailOtp.findMany();
  }

  async createEmailOtp(data: InsertEmailOtp): Promise<EmailOtp> {
    return await prisma.emailOtp.create({ data });
  }

  async deleteEmailOtp(id: number): Promise<void> {
    await prisma.emailOtp.delete({ where: { id } });
  }

  async getCommission(id: number): Promise<Commission | undefined> {
    return await prisma.commission.findUnique({ where: { id } }) || undefined;
  }

  async getAllCommissions(): Promise<Commission[]> {
    return await prisma.commission.findMany();
  }

  async createCommission(data: InsertCommission): Promise<Commission> {
    return await prisma.commission.create({ data });
  }

  async deleteCommission(id: number): Promise<void> {
    await prisma.commission.delete({ where: { id } });
  }

  async getSalesProperty(id: number): Promise<SalesProperty | undefined> {
    return await prisma.salesProperty.findUnique({ where: { id } }) || undefined;
  }

  async getAllSalesPropertys(): Promise<SalesProperty[]> {
    return await prisma.salesProperty.findMany();
  }

  async createSalesProperty(data: InsertSalesProperty): Promise<SalesProperty> {
    return await prisma.salesProperty.create({ data });
  }

  async deleteSalesProperty(id: number): Promise<void> {
    await prisma.salesProperty.delete({ where: { id } });
  }

  async getSalesTransaction(id: number): Promise<SalesTransaction | undefined> {
    return await prisma.salesTransaction.findUnique({ where: { id } }) || undefined;
  }

  async getAllSalesTransactions(): Promise<SalesTransaction[]> {
    return await prisma.salesTransaction.findMany();
  }

  async createSalesTransaction(data: InsertSalesTransaction): Promise<SalesTransaction> {
    return await prisma.salesTransaction.create({ data });
  }

  async deleteSalesTransaction(id: number): Promise<void> {
    await prisma.salesTransaction.delete({ where: { id } });
  }

  async getSalesCommission(id: number): Promise<SalesCommission | undefined> {
    return await prisma.salesCommission.findUnique({ where: { id } }) || undefined;
  }

  async getAllSalesCommissions(): Promise<SalesCommission[]> {
    return await prisma.salesCommission.findMany();
  }

  async createSalesCommission(data: InsertSalesCommission): Promise<SalesCommission> {
    return await prisma.salesCommission.create({ data });
  }

  async deleteSalesCommission(id: number): Promise<void> {
    await prisma.salesCommission.delete({ where: { id } });
  }

  async getPropertyAvailability(id: number): Promise<PropertyAvailability | undefined> {
    return await prisma.propertyAvailability.findUnique({ where: { id } }) || undefined;
  }

  async getAllPropertyAvailabilitys(): Promise<PropertyAvailability[]> {
    return await prisma.propertyAvailability.findMany();
  }

  async createPropertyAvailability(data: InsertPropertyAvailability): Promise<PropertyAvailability> {
    return await prisma.propertyAvailability.create({ data });
  }

  async deletePropertyAvailability(id: number): Promise<void> {
    await prisma.propertyAvailability.delete({ where: { id } });
  }

  async getAgentAmenity(id: number): Promise<AgentAmenity | undefined> {
    return await prisma.agentAmenity.findUnique({ where: { id } }) || undefined;
  }

  async getAllAgentAmenitys(): Promise<AgentAmenity[]> {
    return await prisma.agentAmenity.findMany();
  }

  async createAgentAmenity(data: InsertAgentAmenity): Promise<AgentAmenity> {
    return await prisma.agentAmenity.create({ data });
  }

  async deleteAgentAmenity(id: number): Promise<void> {
    await prisma.agentAmenity.delete({ where: { id } });
  }
}

export const storage = new DatabaseStorage();
