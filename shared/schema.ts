// Prisma types
import type { 
  Agent as PrismaAgent,
  Property as PrismaProperty,
  Booking as PrismaBooking,
  Commission as PrismaCommission,
  SalesProperty as PrismaSalesProperty,
  SalesTransaction as PrismaSalesTransaction,
  SalesCommission as PrismaSalesCommission,
  PropertyAvailability as PrismaPropertyAvailability,
  AgentAmenity as PrismaAgentAmenity,
} from "@prisma/client";

import { z } from "zod";

// Re-export Prisma types
export type Agent = PrismaAgent;
export type Property = PrismaProperty;
export type Booking = PrismaBooking;
export type Commission = PrismaCommission;
export type SalesProperty = PrismaSalesProperty;
export type SalesTransaction = PrismaSalesTransaction;
export type SalesCommission = PrismaSalesCommission;
export type PropertyAvailability = PrismaPropertyAvailability;
export type AgentAmenity = PrismaAgentAmenity;

// Zod validation schemas for inserts (validation only, not type generation)

// Agent validation
export const insertAgentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  agency: z.string().optional(),
  phone: z.string().optional(),
  agencyPhone: z.string().optional(),
  agencyEmail: z.string().email().optional().or(z.literal("")),
});

export type InsertAgent = z.infer<typeof insertAgentSchema>;

// Property validation
export const insertPropertySchema = z.object({
  agentId: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().min(1),
  propertyType: z.string().min(1),
  price: z.union([z.string(), z.number()]).transform((val) => String(val)),
  priceType: z.string().default("night"),
  beds: z.number().int().min(0),
  baths: z.number().int().min(0),
  sqm: z.number().int().positive(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  status: z.string().default("draft"),
  licenseNumber: z.string().optional(),
});

export type InsertProperty = z.infer<typeof insertPropertySchema>;

// Booking validation
export const insertBookingSchema = z.object({
  propertyId: z.number().int().positive(),
  ownerAgentId: z.number().int().positive(),
  bookingAgentId: z.number().int().positive(),
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  clientPhone: z.string().optional(),
  checkIn: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  checkOut: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  totalAmount: z.union([z.string(), z.number()]).transform((val) => String(val)),
  status: z.string().default("pending"),
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;

// Commission validation
export const insertCommissionSchema = z.object({
  bookingId: z.number().int().positive(),
  ownerAgentId: z.number().int().positive(),
  bookingAgentId: z.number().int().positive(),
  totalAmount: z.union([z.string(), z.number()]).transform((val) => String(val)),
  ownerCommission: z.union([z.string(), z.number()]).transform((val) => String(val)),
  bookingCommission: z.union([z.string(), z.number()]).transform((val) => String(val)),
  platformFee: z.union([z.string(), z.number()]).transform((val) => String(val)),
  commissionRate: z.union([z.string(), z.number()]).transform((val) => String(val)),
  status: z.string().default("pending"),
});

export type InsertCommission = z.infer<typeof insertCommissionSchema>;

// Sales Property validation
export const insertSalesPropertySchema = z.object({
  agentId: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().min(1),
  propertyType: z.string().min(1),
  price: z.union([z.string(), z.number()]).transform((val) => String(val)),
  beds: z.number().int().min(0),
  baths: z.number().int().min(0),
  sqm: z.number().int().positive(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  status: z.string().default("draft"),
  licenseNumber: z.string().optional(),
});

export type InsertSalesProperty = z.infer<typeof insertSalesPropertySchema>;

// Sales Transaction validation
export const insertSalesTransactionSchema = z.object({
  propertyId: z.number().int().positive(),
  sellerAgentId: z.number().int().positive(),
  buyerAgentId: z.number().int().positive(),
  buyerName: z.string().min(1),
  buyerEmail: z.string().email(),
  buyerPhone: z.string().optional(),
  salePrice: z.union([z.string(), z.number()]).transform((val) => String(val)),
  saleDate: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  status: z.string().default("pending"),
});

export type InsertSalesTransaction = z.infer<typeof insertSalesTransactionSchema>;

// Sales Commission validation
export const insertSalesCommissionSchema = z.object({
  transactionId: z.number().int().positive(),
  sellerAgentId: z.number().int().positive(),
  buyerAgentId: z.number().int().positive(),
  totalAmount: z.union([z.string(), z.number()]).transform((val) => String(val)),
  sellerCommission: z.union([z.string(), z.number()]).transform((val) => String(val)),
  buyerCommission: z.union([z.string(), z.number()]).transform((val) => String(val)),
  platformFee: z.union([z.string(), z.number()]).transform((val) => String(val)),
  commissionRate: z.union([z.string(), z.number()]).transform((val) => String(val)),
  status: z.string().default("pending"),
});

export type InsertSalesCommission = z.infer<typeof insertSalesCommissionSchema>;

// Property Availability validation
export const insertPropertyAvailabilitySchema = z.object({
  propertyId: z.number().int().positive(),
  startDate: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  endDate: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  isAvailable: z.number().int().default(1),
  bookingId: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export type InsertPropertyAvailability = z.infer<typeof insertPropertyAvailabilitySchema>;

// Agent Amenity validation
export const insertAgentAmenitySchema = z.object({
  agentId: z.number().int().positive(),
  name: z.string().min(1),
});

export type InsertAgentAmenity = z.infer<typeof insertAgentAmenitySchema>;
