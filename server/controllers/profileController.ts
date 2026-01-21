import { Request, Response } from "express";
import { prisma } from "../db";

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
        phone: true,
        onboardingStep: true,
        createdAt: true,
        role: true,

        agency: {
          select: {
            id: true,
            name: true,
            primaryColor: true,
            logo: true,
            phone: true,
            email: true,
            website: true,
            createdAt: true,
            locations: true,
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: "Agent not found" });
    }

    res.json({ agent: profile });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateProfileController = async (req: Request, res: Response) => {
  try {
    const agent = (req as any).agent;

    const {
      name,
      phone,
      locations,

      // agency fields
      agencyName,
      color,
      logo,
      agencyPhone,
      agencyEmail,
      website,
    } = req.body;

    // 1️⃣ Update agent personal info
    const updatedAgent = await prisma.agent.update({
      where: { id: agent.id },
      data: {
        name,
        phone,
      },
    });

    // 2️⃣ Update agency info (only if agent belongs to one)
    if (agent.agencyId) {
      // OPTIONAL but RECOMMENDED: check admin role
      if (agent.role !== "ADMIN") {
        return res.status(403).json({
          error: "Only agency admins can update agency information",
        });
      }

      await prisma.agency.update({
        where: { id: agent.agencyId },
        data: {
          name: agencyName,
          primaryColor: color,
          locations,
          logo,
          phone: agencyPhone,
          email: agencyEmail,
          website,
        },
      });
    }

    res.json({ agent: updatedAgent });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
