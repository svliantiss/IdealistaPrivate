import { Request, Response } from "express";
import { prisma } from "../db";
import { createAndSendOtp, verifyOtp } from "../services/emailOtpService";
import { signToken } from "../utils/jwt";

export const requestOtp = async (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  let agent = await prisma.agent.findUnique({ where: { email } });
  if (!agent) {
    agent = await prisma.agent.create({ data: { email, name, onboardingStep: 1 } });
  }

  await createAndSendOtp(email);
  res.json({ success: true, message: "OTP sent" });
};

export const verifyOtpController = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

  const valid = await verifyOtp(email, otp);
  if (!valid) return res.status(400).json({ error: "Invalid or expired OTP" });

  // Mark email verified
  const agent = await prisma.agent.update({
    where: { email },
    data: { emailVerified: true, onboardingStep: 2 },
  });

  const token = signToken(agent.id, agent.email);
  res.json({ token, agent });
};
