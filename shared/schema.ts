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
  status: text("status").notNull().default("pending"), // pending, confirmed, paid, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({ 
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
