// types/otp.ts

export const OTP_TYPES = {
  REGISTRATION: "registration",
  LOGIN: "login",
  EMAIL_CHANGE: "email_change",
  BOOKING_CONFIRMATION: "booking_confirmation",
} as const;

// Type-safe union
export type OtpType = typeof OTP_TYPES[keyof typeof OTP_TYPES];
