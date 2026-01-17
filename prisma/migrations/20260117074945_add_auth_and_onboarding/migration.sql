/*
  Warnings:

  - Added the required column `location` to the `agents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "location" TEXT NOT NULL;
