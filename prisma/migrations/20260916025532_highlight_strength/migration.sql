/*
  Warnings:

  - Added the required column `strength` to the `Highlight` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Highlight" ADD COLUMN     "strength" INTEGER NOT NULL;
