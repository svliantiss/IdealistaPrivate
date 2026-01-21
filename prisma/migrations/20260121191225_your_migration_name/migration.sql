/*
  Warnings:

  - Added the required column `licenseNumber` to the `sales_properties` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sales_properties" ADD COLUMN     "licenseNumber" TEXT NOT NULL;
