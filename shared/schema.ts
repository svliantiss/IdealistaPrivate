import { pgTable, text, integer, timestamp, decimal, serial } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Agents Table
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  agency: text("agency"),
  phone: text("phone"),
  agencyPhone: text("agency_phone"),
  agencyEmail: text("agency_email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgentSchema = createInsertSchema(agents).omit({ id: true, createdAt: true });
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

// Properties Table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => agents.id),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  propertyType: text("property_type").notNull(), // villa, apartment, studio
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  beds: integer("beds").notNull(),
  baths: integer("baths").notNull(),
  sqm: integer("sqm").notNull(),
  amenities: text("amenities").array().notNull().default(sql`ARRAY[]::text[]`),
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  status: text("status").notNull().default("draft"), // draft, active, inactive
  licenseNumber: text("license_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// Bookings Table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  ownerAgentId: integer("owner_agent_id").notNull().references(() => agents.id),
  bookingAgentId: integer("booking_agent_id").notNull().references(() => agents.id),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientPhone: text("client_phone"),
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, paid, cancelled, cancellation_requested, archived
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(bookings, {
  checkIn: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val),
  checkOut: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val),
}).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Commission Tracking Table
export const commissions = pgTable("commissions", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  ownerAgentId: integer("owner_agent_id").notNull().references(() => agents.id),
  bookingAgentId: integer("booking_agent_id").notNull().references(() => agents.id),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  ownerCommission: decimal("owner_commission", { precision: 10, scale: 2 }).notNull(),
  bookingCommission: decimal("booking_commission", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull().default("10.00"), // percentage
  status: text("status").notNull().default("pending"), // pending, paid
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommissionSchema = createInsertSchema(commissions).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertCommission = z.infer<typeof insertCommissionSchema>;
export type Commission = typeof commissions.$inferSelect;

// Sales Properties Table (For Sale listings)
export const salesProperties = pgTable("sales_properties", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => agents.id),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  propertyType: text("property_type").notNull(), // villa, apartment, studio, townhouse, etc.
  price: decimal("price", { precision: 12, scale: 2 }).notNull(), // sale price
  beds: integer("beds").notNull(),
  baths: integer("baths").notNull(),
  sqm: integer("sqm").notNull(),
  amenities: text("amenities").array().notNull().default(sql`ARRAY[]::text[]`),
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  status: text("status").notNull().default("draft"), // draft, active, inactive, sold
  licenseNumber: text("license_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSalesPropertySchema = createInsertSchema(salesProperties).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertSalesProperty = z.infer<typeof insertSalesPropertySchema>;
export type SalesProperty = typeof salesProperties.$inferSelect;

// Sales Transactions Table
export const salesTransactions = pgTable("sales_transactions", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => salesProperties.id),
  sellerAgentId: integer("seller_agent_id").notNull().references(() => agents.id),
  buyerAgentId: integer("buyer_agent_id").notNull().references(() => agents.id),
  buyerName: text("buyer_name").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  buyerPhone: text("buyer_phone"),
  salePrice: decimal("sale_price", { precision: 12, scale: 2 }).notNull(),
  saleDate: timestamp("sale_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSalesTransactionSchema = createInsertSchema(salesTransactions).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertSalesTransaction = z.infer<typeof insertSalesTransactionSchema>;
export type SalesTransaction = typeof salesTransactions.$inferSelect;

// Sales Commissions Table
export const salesCommissions = pgTable("sales_commissions", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull().references(() => salesTransactions.id),
  sellerAgentId: integer("seller_agent_id").notNull().references(() => agents.id),
  buyerAgentId: integer("buyer_agent_id").notNull().references(() => agents.id),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  sellerCommission: decimal("seller_commission", { precision: 12, scale: 2 }).notNull(),
  buyerCommission: decimal("buyer_commission", { precision: 12, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 12, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull().default("4.00"), // percentage
  status: text("status").notNull().default("pending"), // pending, paid
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSalesCommissionSchema = createInsertSchema(salesCommissions).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertSalesCommission = z.infer<typeof insertSalesCommissionSchema>;
export type SalesCommission = typeof salesCommissions.$inferSelect;

// Property Availability Table (for rental calendar)
export const propertyAvailability = pgTable("property_availability", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isAvailable: integer("is_available").notNull().default(1), // 1 = available, 0 = unavailable/booked
  bookingId: integer("booking_id").references(() => bookings.id), // link to booking if unavailable due to booking
  notes: text("notes"), // optional notes (e.g., "owner blocked", "maintenance")
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPropertyAvailabilitySchema = createInsertSchema(propertyAvailability).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertPropertyAvailability = z.infer<typeof insertPropertyAvailabilitySchema>;
export type PropertyAvailability = typeof propertyAvailability.$inferSelect;
