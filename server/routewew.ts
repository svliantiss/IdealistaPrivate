import { storage } from "./storage";
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { insertPropertySchema, insertBookingSchema, insertCommissionSchema, insertAgentSchema, insertSalesPropertySchema, insertSalesTransactionSchema, insertSalesCommissionSchema, insertPropertyAvailabilitySchema, insertAgentAmenitySchema } from "@shared/schema";
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

// Admin authentication will be implemented with OTP

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ===== AGENT ROUTES =====
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAllAgents();
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

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
      // Auto-archive past bookings before fetching
      await storage.archivePastBookings();
      
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

      // Get booking agent and owner agent to check if same agency
      const bookingAgent = await storage.getAgent(result.data.bookingAgentId);
      const ownerAgent = await storage.getAgent(result.data.ownerAgentId);
      
      // Auto-confirm if same agency, otherwise pending
      const isSameAgency = bookingAgent?.agency && ownerAgent?.agency && 
                           bookingAgent.agency === ownerAgent.agency;
      const bookingStatus = isSameAgency ? "confirmed" : "pending";
      
      const booking = await storage.createBooking({
        ...result.data,
        status: bookingStatus,
      });
      
      // Auto-create commission record (20% commission pool split 48/48/4)
      const totalAmount = parseFloat(booking.totalAmount);
      const commissionPool = totalAmount * 0.20; // 20% of rental price
      const ownerCommission = commissionPool * 0.48;
      const bookingCommission = commissionPool * 0.48;
      const platformFee = commissionPool * 0.04;
      
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

      // Mark dates as booked in property availability (only if confirmed)
      if (bookingStatus === "confirmed") {
        await storage.createPropertyAvailability({
          propertyId: booking.propertyId,
          startDate: booking.checkIn,
          endDate: booking.checkOut,
          isAvailable: 0, // 0 = booked
        });
      }
      
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
      
      // Get the booking before updating to check previous status
      const existingBooking = await storage.getBooking(parseInt(req.params.id));
      if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const booking = await storage.updateBookingStatus(parseInt(req.params.id), status);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // If booking is being confirmed (approved), mark dates as booked
      if (status === "confirmed" && existingBooking.status === "pending") {
        await storage.createPropertyAvailability({
          propertyId: booking.propertyId,
          startDate: booking.checkIn,
          endDate: booking.checkOut,
          isAvailable: 0, // 0 = booked
        });
      }
      
      // If booking is being cancelled and was confirmed/paid/cancellation_requested, free up the dates
      if (status === "cancelled" && (existingBooking.status === "confirmed" || existingBooking.status === "paid" || existingBooking.status === "cancellation_requested")) {
        await storage.deletePropertyAvailabilityByDates(
          booking.propertyId,
          booking.checkIn,
          booking.checkOut
        );
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Request cancellation for cross-agency bookings
  app.patch("/api/bookings/:id/request-cancellation", async (req, res) => {
    try {
      const existingBooking = await storage.getBooking(parseInt(req.params.id));
      if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Set status to "cancellation_requested"
      const booking = await storage.updateBookingStatus(parseInt(req.params.id), "cancellation_requested");
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error requesting cancellation:", error);
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

  // ===== PROPERTY AVAILABILITY ROUTES =====
  app.get("/api/property-availability", async (req, res) => {
    try {
      const availability = await storage.getAllPropertyAvailability();
      res.json(availability);
    } catch (error) {
      console.error("Error fetching property availability:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/property-availability/:propertyId", async (req, res) => {
    try {
      const availability = await storage.getPropertyAvailability(parseInt(req.params.propertyId));
      res.json(availability);
    } catch (error) {
      console.error("Error fetching property availability:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/property-availability", async (req, res) => {
    try {
      const result = insertPropertyAvailabilitySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: fromZodError(result.error).toString() 
        });
      }
      const availability = await storage.createPropertyAvailability(result.data);
      res.status(201).json(availability);
    } catch (error) {
      console.error("Error creating property availability:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/property-availability/:id", async (req, res) => {
    try {
      const availability = await storage.updatePropertyAvailability(parseInt(req.params.id), req.body);
      if (!availability) {
        return res.status(404).json({ message: "Availability record not found" });
      }
      res.json(availability);
    } catch (error) {
      console.error("Error updating property availability:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/property-availability/:id", async (req, res) => {
    try {
      await storage.deletePropertyAvailability(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting property availability:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== ADMIN ROUTES =====
  
  // Admin login - OTP authentication to be implemented
  app.post("/api/admin/login", (req, res) => {
    res.status(501).json({ 
      success: false, 
      message: "Admin login with OTP authentication is not yet implemented." 
    });
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
      // If no status specified, fetch all statuses (active, sold, etc.)
      const statusFilter = status ? (status as string) : undefined;
      const properties = await storage.getAllSalesProperties({
        location: location as string,
        propertyType: propertyType as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        status: statusFilter,
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
      // Total commission: 4% of sale price, split as: 48% seller, 48% buyer, 4% platform
      const totalAmount = parseFloat(transaction.salePrice);
      const totalCommission = totalAmount * 0.04; // 4% total commission
      const sellerCommission = totalCommission * 0.48; // 48% of commission to seller
      const buyerCommission = totalCommission * 0.48;  // 48% of commission to buyer
      const platformFee = totalCommission * 0.04;     // 4% of commission to platform
      
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

  // ===== EMPLOYEE STATS ROUTES =====
  app.get("/api/employees/agency/:agency/stats", async (req, res) => {
    try {
      const employees = await storage.getAgentsByAgency(req.params.agency);
      const statsPromises = employees.map(async (emp) => {
        const bookings = await storage.getBookingsByAgent(emp.id);
        const commissions = await storage.getCommissionsByAgent(emp.id);
        const salesCommissions = await storage.getSalesCommissionsByAgent(emp.id);
        
        const totalCommission = commissions.reduce((sum: number, c: any) => {
          const isOwner = c.ownerAgentId === emp.id;
          const yourCommission = isOwner ? parseFloat(c.ownerCommission || 0) : parseFloat(c.bookingCommission || 0);
          return sum + yourCommission;
        }, 0);
        const totalSalesCommission = salesCommissions.reduce((sum: number, c: any) => {
          const isSeller = c.sellerAgentId === emp.id;
          const yourCommission = isSeller ? parseFloat(c.sellerCommission || 0) : parseFloat(c.buyerCommission || 0);
          return sum + yourCommission;
        }, 0);
        
        return {
          ...emp,
          totalBookings: bookings.length,
          totalCommission: parseFloat(totalCommission.toFixed(2)),
          totalSalesCommission: parseFloat(totalSalesCommission.toFixed(2)),
        };
      });
      
      const employeeStats = await Promise.all(statsPromises);
      res.json(employeeStats);
    } catch (error) {
      console.error("Error fetching employee stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== AGENT AMENITIES ROUTES =====
  app.get("/api/agents/:agentId/amenities", async (req, res) => {
    try {
      const amenities = await storage.getAgentAmenities(parseInt(req.params.agentId));
      res.json(amenities);
    } catch (error) {
      console.error("Error fetching agent amenities:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/agents/:agentId/amenities", async (req, res) => {
    try {
      const result = insertAgentAmenitySchema.safeParse({
        ...req.body,
        agentId: parseInt(req.params.agentId),
      });
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      const amenity = await storage.createAgentAmenity(result.data);
      res.status(201).json(amenity);
    } catch (error) {
      console.error("Error creating agent amenity:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/agents/:agentId/amenities/:id", async (req, res) => {
    try {
      await storage.deleteAgentAmenity(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting agent amenity:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
