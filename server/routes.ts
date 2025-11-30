import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPropertySchema, insertBookingSchema, insertCommissionSchema, insertAgentSchema, insertSalesPropertySchema, insertSalesTransactionSchema, insertSalesCommissionSchema } from "@shared/schema";
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

// Admin password - REQUIRED for security
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Log warning if ADMIN_PASSWORD is not set
if (!ADMIN_PASSWORD) {
  console.error('WARNING: ADMIN_PASSWORD environment variable is not set. Admin panel will be inaccessible.');
}

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
      
      // Auto-create commission record (48% to each agent, 4% platform fee)
      const totalAmount = parseFloat(booking.totalAmount);
      const ownerCommission = totalAmount * 0.48;
      const bookingCommission = totalAmount * 0.48;
      const platformFee = totalAmount * 0.04;
      
      await storage.createCommission({
        bookingId: booking.id,
        ownerAgentId: booking.ownerAgentId,
        bookingAgentId: booking.bookingAgentId,
        totalAmount: booking.totalAmount,
        ownerCommission: ownerCommission.toFixed(2),
        bookingCommission: bookingCommission.toFixed(2),
        platformFee: platformFee.toFixed(2),
        commissionRate: "96.00",
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
    if (!ADMIN_PASSWORD) {
      return res.status(503).json({ 
        success: false, 
        message: "Admin panel is not configured. Please set ADMIN_PASSWORD environment variable." 
      });
    }
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

  // ===== SALES PROPERTY ROUTES =====
  app.get("/api/sales-properties", async (req, res) => {
    try {
      const { location, propertyType, minPrice, maxPrice, status } = req.query;
      const properties = await storage.getAllSalesProperties({
        location: location as string,
        propertyType: propertyType as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        status: (status as string) || "active",
      });
      res.json(properties);
    } catch (error) {
      console.error("Error fetching sales properties:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/sales-properties/:id", async (req, res) => {
    try {
      const property = await storage.getSalesProperty(parseInt(req.params.id));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error fetching sales property:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/agents/:agentId/sales-properties", async (req, res) => {
    try {
      const properties = await storage.getSalesPropertiesByAgent(parseInt(req.params.agentId));
      res.json(properties);
    } catch (error) {
      console.error("Error fetching agent sales properties:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/sales-properties", async (req, res) => {
    try {
      const result = insertSalesPropertySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: fromZodError(result.error).toString() 
        });
      }
      const property = await storage.createSalesProperty(result.data);
      res.status(201).json(property);
    } catch (error) {
      console.error("Error creating sales property:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/sales-properties/:id", async (req, res) => {
    try {
      const property = await storage.updateSalesProperty(parseInt(req.params.id), req.body);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error updating sales property:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/sales-properties/:id", async (req, res) => {
    try {
      await storage.deleteSalesProperty(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting sales property:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== SALES TRANSACTION ROUTES =====
  app.get("/api/sales-transactions", async (req, res) => {
    try {
      const { agentId } = req.query;
      let transactions: any[] = [];
      if (agentId) {
        transactions = await storage.getSalesTransactionsByAgent(parseInt(agentId as string));
      }
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching sales transactions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/sales-transactions", async (req, res) => {
    try {
      const result = insertSalesTransactionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: fromZodError(result.error).toString() 
        });
      }
      const transaction = await storage.createSalesTransaction(result.data);
      
      // Auto-create sales commission record
      // Commission is 4% of sale price split between agents: 2% seller, 2% buyer
      const totalAmount = parseFloat(transaction.salePrice);
      const sellerCommission = totalAmount * 0.02; // 2% to seller agent
      const buyerCommission = totalAmount * 0.02;  // 2% to buyer agent
      const platformFee = 0; // Platform takes no additional fee
      
      await storage.createSalesCommission({
        transactionId: transaction.id,
        sellerAgentId: transaction.sellerAgentId,
        buyerAgentId: transaction.buyerAgentId,
        totalAmount: transaction.salePrice,
        sellerCommission: sellerCommission.toFixed(2),
        buyerCommission: buyerCommission.toFixed(2),
        platformFee: platformFee.toFixed(2),
        commissionRate: "4.00",
        status: "pending",
      });
      
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating sales transaction:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/sales-transactions/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      const transaction = await storage.updateSalesTransactionStatus(parseInt(req.params.id), status);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error updating sales transaction status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== SALES COMMISSION ROUTES =====
  app.get("/api/sales-commissions/agent/:agentId", async (req, res) => {
    try {
      const commissions = await storage.getSalesCommissionsByAgent(parseInt(req.params.agentId));
      res.json(commissions);
    } catch (error) {
      console.error("Error fetching sales commissions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
