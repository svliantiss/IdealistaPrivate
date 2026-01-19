import { Request, Response } from "express";
import { prisma } from "../db";

// --- Get agent profile ---
export const getProfileController = async (req: Request, res: Response) => {
  try {
    const agent = (req as any).agent;

    const profile = await prisma.agent.findUnique({
      where: { id: agent.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        agency: true,
        color: true,
        logo: true,
        phone: true,
        agencyPhone: true,
        agencyEmail: true,
        website: true,
        locations: true,
        onboardingStep: true,
        createdAt: true,
      },
    });

    if (!profile) return res.status(404).json({ error: "Agent not found" });

    res.json({ agent: profile });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};

// --- Update agent profile ---
export const updateProfileController = async (req: Request, res: Response) => {
  try {
    const agent = (req as any).agent;
    const {
      name,
      agency,
      color,
      phone,
      agencyPhone,
      agencyEmail,
      website,
      locations,
      logo,
      logoUrl,
    } = req.body;




    const updated = await prisma.agent.update({
      where: { id: agent.id },
      data: {
        name,
        agency,
        color,
        phone,
        agencyPhone,
        agencyEmail,
        website,
        locations,
        logo,
      },
    });

    res.json({ agent: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};
