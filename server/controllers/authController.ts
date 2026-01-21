import { Request, Response } from "express";
import { prisma } from "../db";
import { createAndSendOtp, verifyOtp } from "../services/emailOtpService";
import { signToken } from "../utils/jwt";
import { OTP_TYPES } from "../types/otp";
import jwt from "jsonwebtoken";


// --- Registration OTP ---
export const requestOtp = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: "Email and name required" });
    }

    let agent = await prisma.agent.findUnique({ where: { email } });

    if (agent) {
      // If user has completed onboarding (step >= max step, e.g., 3), tell them to login
      if (agent.onboardingStep >= 3) {
        return res.status(400).json({
          success: false,
          message: "You have already completed registration. Please sign in.",
        });
      }
    } else {
      // Create Agency + Admin Agent
      const agency = await prisma.agency.create({
        data: { name: `${name}'s Agency` },
      });

      agent = await prisma.agent.create({
        data: {
          email,
          name,
          role: "ADMIN",
          agencyId: agency.id,
          onboardingStep: 1,
        },
      });
    }

    // Send OTP for registration
    await createAndSendOtp(email, OTP_TYPES.REGISTRATION);

    res.json({ success: true, message: "OTP sent for registration" });
  } catch (error) {
    console.log(error)

  }
};

export const verifyOtpController = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP required" });
  }

  const valid = await verifyOtp(email, otp, OTP_TYPES.REGISTRATION);
  if (!valid) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  const agent = await prisma.agent.update({
    where: { email },
    data: {
      emailVerified: true,
      onboardingStep: 2,
    },
    include: { agency: true },
  });

  const token = signToken(agent.id, agent.email);
  res.json({ token, agent });
};


// --- Login OTP ---
export const requestLoginOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const agent = await prisma.agent.findUnique({ where: { email, emailVerified: true } });
  console.log({ agent })
  if (!agent) return res.status(404).json({ error: "Agent not found" });

  await createAndSendOtp(email, OTP_TYPES.LOGIN);
  res.json({ success: true, message: "OTP sent for login" });
};

export const verifyLoginOtpController = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP required" });
  }

  const valid = await verifyOtp(email, otp, OTP_TYPES.LOGIN);
  if (!valid) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  const agent = await prisma.agent.findUnique({
    where: { email },
    include: { agency: true },
  });

  if (!agent) return res.status(404).json({ error: "Agent not found" });

  const token = signToken(agent.id, agent.email);
  res.json({ token, agent });
};

export const verifyAuthTokenController = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ authenticated: false });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    return res.json({
      authenticated: true,
      user: payload,
    });
  } catch {
    return res.status(401).json({ authenticated: false });
  }
}
