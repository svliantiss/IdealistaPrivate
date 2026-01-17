import { Request, Response } from "express";
import { prisma } from "./../db";

export const step3Branding = async (req: Request, res: Response) => {
    const agent = (req as any).agent;
    const { agencyName, agencyColor } = req.body;
    if (!agencyName || !agencyColor) return res.status(400).json({ error: "Missing fields" });

    const updated = await prisma.agent.update({
        where: { id: agent.id },
        data: { agency: agencyName, color: agencyColor, onboardingStep: 3 },
    });

    res.json({ agent: updated });
};

export const step4Contact = async (req: Request, res: Response) => {
    const agent = (req as any).agent;
    const { agencyPhone, location } = req.body;
    if (!agencyPhone || !location?.length) return res.status(400).json({ error: "Missing fields" });

    const updated = await prisma.agent.update({
        where: { id: agent.id },
        data: { agencyPhone, location, onboardingStep: 4 },
    });

    res.json({ agent: updated });
};
