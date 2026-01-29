/*
  Warnings:

  - Added the required column `duration` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "additionNote" TEXT,
ADD COLUMN     "duration" TEXT NOT NULL,
ALTER COLUMN "clientEmail" DROP NOT NULL;
