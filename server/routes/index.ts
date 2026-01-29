import { Express } from "express";
import { Server } from "http";
import authRoutes from "./auth";

import uploadRoutes from "./storage";
import profileRoutes from "./profile";
import propertyRoutes from "./properties";
import publicApiRoutes from "./public";
import searchProperty from "./search"
import onboardingRoutes from "./onboarding";
import imageRoutes from "./image";
import bookingRoutes from "./bookings";
import { verifyAuthTokenController } from "server/controllers/authController";

export async function registerRoutes(server: Server, app: Express) {
  // All API routes under /api
  app.use("/api/auth", authRoutes);
  app.use("/api/onboarding", onboardingRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/general", publicApiRoutes);
  app.use("/api/properties", propertyRoutes);
  app.use("/api", imageRoutes);
  app.use("/api", uploadRoutes);
  app.use("/api/search", searchProperty);
  app.get("/api/auth/me", verifyAuthTokenController);
  console.log("✅ Routes registered");

  // You can add more routes here
}
