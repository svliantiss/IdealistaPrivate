// Prisma types
import type { Agent as PrismaAgent, Property as PrismaProperty, Booking as PrismaBooking, EmailOtp as PrismaEmailOtp, Commission as PrismaCommission, SalesProperty as PrismaSalesProperty, SalesTransaction as PrismaSalesTransaction, SalesCommission as PrismaSalesCommission, PropertyAvailability as PrismaPropertyAvailability, AgentAmenity as PrismaAgentAmenity } from "@prisma/client";
import { z } from "zod";

// Re-export Prisma types
export type Agent = PrismaAgent;
export type Property = PrismaProperty;
export type Booking = PrismaBooking;
export type EmailOtp = PrismaEmailOtp;
export type Commission = PrismaCommission;
export type SalesProperty = PrismaSalesProperty;
export type SalesTransaction = PrismaSalesTransaction;
export type SalesCommission = PrismaSalesCommission;
export type PropertyAvailability = PrismaPropertyAvailability;
export type AgentAmenity = PrismaAgentAmenity;

// Zod validation schemas for inserts

export const insertAgentSchema = z.object({
  // Add fields here manually or extend script to parse schema fields
});
export type InsertAgent = z.infer<typeof insertAgentSchema>;

export const insertPropertySchema = z.object({
  // Add fields here manually or extend script to parse schema fields
});
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export const insertBookingSchema = z.object({
  // Add fields here manually or extend script to parse schema fields
});
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export const insertEmailOtpSchema = z.object({
  // Add fields here manually or extend script to parse schema fields
});
export type InsertEmailOtp = z.infer<typeof insertEmailOtpSchema>;

export const insertCommissionSchema = z.object({
  // Add fields here manually or extend script to parse schema fields
});
export type InsertCommission = z.infer<typeof insertCommissionSchema>;

export const insertSalesPropertySchema = z.object({
  // Add fields here manually or extend script to parse schema fields
});
export type InsertSalesProperty = z.infer<typeof insertSalesPropertySchema>;

export const insertSalesTransactionSchema = z.object({
  // Add fields here manually or extend script to parse schema fields
});
export type InsertSalesTransaction = z.infer<typeof insertSalesTransactionSchema>;

export const insertSalesCommissionSchema = z.object({
  // Add fields here manually or extend script to parse schema fields
});
export type InsertSalesCommission = z.infer<typeof insertSalesCommissionSchema>;

export const insertPropertyAvailabilitySchema = z.object({
  // Add fields here manually or extend script to parse schema fields
});
export type InsertPropertyAvailability = z.infer<typeof insertPropertyAvailabilitySchema>;

export const insertAgentAmenitySchema = z.object({
  // Add fields here manually or extend script to parse schema fields
});
export type InsertAgentAmenity = z.infer<typeof insertAgentAmenitySchema>;
