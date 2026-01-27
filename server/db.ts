import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Initialize Prisma Client with Accelerate URL
export const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
});

// For backwards compatibility during migration
export const db = prisma;
