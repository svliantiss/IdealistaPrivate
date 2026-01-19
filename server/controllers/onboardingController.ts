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
    const { agencyPhone, locations } = req.body;
    console.log({ agencyPhone, locations });
    if (!agencyPhone || !locations?.length) return res.status(400).json({ error: "Missing fields" });

    const updated = await prisma.agent.update({
        where: { id: agent.id },
        data: { agencyPhone, locations, onboardingStep: 4 },
    });

    res.json({ agent: updated });
};
