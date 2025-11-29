import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPropertySchema, insertBookingSchema, insertCommissionSchema, insertAgentSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// Extend session type for admin authentication
declare module 'express-session' {
  interface SessionData {
    isAdmin?: boolean;
  }
}

// Admin authentication middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized - Admin login required" });
  }
};

// Admin password (in production, use env variable)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ===== AGENT ROUTES =====
  app.get("/api/agents/:id", async (req, res) => {
    try {
      const agent = await storage.getAgent(parseInt(req.params.id));
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== PROPERTY ROUTES =====
  app.get("/api/properties", async (req, res) => {
    try {
      const { location, propertyType, minPrice, maxPrice, status } = req.query;
      const properties = await storage.getAllProperties({
        location: location as string,
        propertyType: propertyType as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        status: (status as string) || "active",
      });
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getProperty(parseInt(req.params.id));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/agents/:agentId/properties", async (req, res) => {
    try {
      const properties = await storage.getPropertiesByAgent(parseInt(req.params.agentId));
      res.json(properties);
    } catch (error) {
      console.error("Error fetching agent properties:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/properties", async (req, res) => {
    try {
      const result = insertPropertySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: fromZodError(result.error).toString() 
        });
      }
      const property = await storage.createProperty(result.data);
      res.status(201).json(property);
    } catch (error) {
      console.error("Error creating property:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.updateProperty(parseInt(req.params.id), req.body);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error updating property:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/properties/:id", async (req, res) => {
    try {
      await storage.deleteProperty(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== BOOKING ROUTES =====
  app.get("/api/bookings", async (req, res) => {
    try {
      const { agentId } = req.query;
      let bookings;
      if (agentId) {
        bookings = await storage.getBookingsByAgent(parseInt(agentId as string));
      } else {
        bookings = await storage.getAllBookings();
      }
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBooking(parseInt(req.params.id));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const result = insertBookingSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: fromZodError(result.error).toString() 
        });
      }
      const booking = await storage.createBooking(result.data);
      
      // Auto-create commission record
      const commissionRate = 10; // 10% commission
      const totalAmount = parseFloat(booking.totalAmount);
      const platformFee = totalAmount * 0.05; // 5% platform fee
      const totalCommission = totalAmount * (commissionRate / 100);
      const ownerCommission = totalCommission * 0.5;
      const bookingCommission = totalCommission * 0.5;
      
      await storage.createCommission({
        bookingId: booking.id,
        ownerAgentId: booking.ownerAgentId,
        bookingAgentId: booking.bookingAgentId,
        totalAmount: booking.totalAmount,
        ownerCommission: ownerCommission.toFixed(2),
        bookingCommission: bookingCommission.toFixed(2),
        platformFee: platformFee.toFixed(2),
        commissionRate: commissionRate.toFixed(2),
        status: "pending",
      });
      
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/bookings/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      const booking = await storage.updateBookingStatus(parseInt(req.params.id), status);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== COMMISSION ROUTES =====
  app.get("/api/commissions/agent/:agentId", async (req, res) => {
    try {
      const commissions = await storage.getCommissionsByAgent(parseInt(req.params.agentId));
      res.json(commissions);
    } catch (error) {
      console.error("Error fetching commissions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== ADMIN ROUTES =====
  
  // Admin login
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      req.session.isAdmin = true;
      res.json({ success: true, message: "Login successful" });
    } else {
      res.status(401).json({ success: false, message: "Invalid password" });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ message: "Error logging out" });
      } else {
        res.json({ success: true, message: "Logged out successfully" });
      }
    });
  });

  // Check admin status
  app.get("/api/admin/status", (req, res) => {
    res.json({ isAdmin: req.session.isAdmin || false });
  });

  // Get all agents (admin only)
  app.get("/api/admin/agents", requireAdmin, async (req, res) => {
    try {
      const agents = await storage.getAllAgents();
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new agent (admin only)
  app.post("/api/admin/agents", requireAdmin, async (req, res) => {
    try {
      const result = insertAgentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: fromZodError(result.error).toString() 
        });
      }
      const agent = await storage.createAgent(result.data);
      res.status(201).json(agent);
    } catch (error) {
      console.error("Error creating agent:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete agent (admin only)
  app.delete("/api/admin/agents/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteAgent(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting agent:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
