import { prisma } from "../db";
import { OTP_TYPES, OtpType } from "../types/otp";
import { hashCode, compareHash } from "../utils/hash"; // your hash functions
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const createAndSendOtp = async (email: string, type: OtpType = OTP_TYPES.REGISTRATION) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await hashCode(code);

  await prisma.emailOtp.create({
    data: {
      email,
      codeHash,
      type,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min expiry
    },
  });

  await resend.emails.send({
    from: "info@optimize4ai.com",
    to: email,
    subject: "Your OTP Code",
    html: `<p>Your OTP for ${type} is <strong>${code}</strong></p>`,
  });

  return code;
};

export const verifyOtp = async (email: string, input: string, type: OtpType) => {
  const otp = await prisma.emailOtp.findFirst({
    where: { email, type, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return false;

  const isValid = await compareHash(input, otp.codeHash);
  if (!isValid || otp.expiresAt < new Date()) return false;

  await prisma.emailOtp.update({ where: { id: otp.id }, data: { used: true } });
  return true;
};
