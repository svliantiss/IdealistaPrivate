import { Express } from "express";
import { Server } from "http";
import authRoutes from "./auth";
import onboardingRoutes from "./onboarding";

export async function registerRoutes(server: Server, app: Express) {
  // All API routes under /api
  app.use("/api/auth", authRoutes);
  app.use("/api/onboarding", onboardingRoutes);

  // You can add more routes here
}
