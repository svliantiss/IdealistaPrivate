import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Hash a string (OTP, etc.)
 * @param value string to hash
 * @returns hashed string
 */
export const hashCode = async (value: string): Promise<string> => {
  return await bcrypt.hash(value, SALT_ROUNDS);
};

/**
 * Compare a plain string with a hash
 * @param value plain string
 * @param hash hashed string
 * @returns true if match
 */
export const compareHash = async (value: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(value, hash);
};
