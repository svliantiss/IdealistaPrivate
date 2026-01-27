import { Request, Response } from "express";
import { prisma } from "../db";

export const step3Branding = async (req: Request, res: Response) => {
    const agent = (req as any).agent;
    const { agencyName, agencyColor, agencySecondaryColor, logo } = req.body;

    if (!agencyName || !agencyColor) {
        return res.status(400).json({ error: "Missing fields" });
    }

    // Update Agency branding
    await prisma.agency.update({
        where: { id: agent.agencyId },
        data: {
            name: agencyName,
            primaryColor: agencyColor,
            secondaryColor: agencySecondaryColor || null,
            logo,
        },
    });

    // Advance onboarding step
    const updatedAgent = await prisma.agent.update({
        where: { id: agent.id },
        data: { onboardingStep: 3 },
    });

    res.json({ success: true, agent: updatedAgent });
};


export const step4Contact = async (req: Request, res: Response) => {
    const agent = (req as any).agent;

    const { agencyPhone, website, locations } = req.body;
    console.log({ website })

    if (!agencyPhone || !locations?.length) {
        return res.status(400).json({ error: "Missing fields" });
    }

    // Update Agency contact info
    let updateagency = await prisma.agency.update({
        where: { id: agent.agencyId },
        data: {
            phone: agencyPhone,
            website,
            locations
        },
    });

    // Update agent-specific info
    const updatedAgent = await prisma.agent.update({
        where: { id: agent.id },
        data: {
            onboardingStep: 4,
        },
    });
    console.log({ updateagency, updatedAgent })
    res.json({ success: true, agent: updatedAgent });
};
