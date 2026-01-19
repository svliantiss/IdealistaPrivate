import { Express } from "express";
import { Server } from "http";
import authRoutes from "./auth";
import uploadRoutes from "./storage";
import onboardingRoutes from "./onboarding";
import { verifyAuthTokenController } from "server/controllers/authController";

export async function registerRoutes(server: Server, app: Express) {
  // All API routes under /api
  app.use("/api/auth", authRoutes);
  app.use("/api/onboarding", onboardingRoutes);
  app.use("/api", uploadRoutes);
  app.get("/api/auth/me", verifyAuthTokenController);
  console.log("✅ Routes registered");

  // You can add more routes here
}
