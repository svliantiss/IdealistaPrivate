import { prisma } from "./../db";
import bcrypt from "bcrypt";
import Resend from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

// Send OTP email via Resend
export const sendOtpEmail = async (email: string, otp: string) => {
  await resend.emails.send({
    from: "Idealista <no-reply@idealista.com>",
    to: email,
    subject: "Your OTP Code",
    html: `<p>Your verification code is <strong>${otp}</strong></p>`,
  });
};

// Generate, store, and send OTP
export const createAndSendOtp = async (email: string) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.emailOtp.create({ data: { email, codeHash, expiresAt } });
  await sendOtpEmail(email, otp);

  return otp; // optional, for testing
};

// Verify OTP
export const verifyOtp = async (email: string, otp: string) => {
  const record = await prisma.emailOtp.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return false;
  if (record.expiresAt < new Date()) return false;

  const valid = await bcrypt.compare(otp, record.codeHash);
  if (!valid) return false;

  // Delete used OTP
  await prisma.emailOtp.delete({ where: { id: record.id } });
  return true;
};
