/*
  Warnings:

  - You are about to drop the column `amount` on the `BudgetItems` table. All the data in the column will be lost.
  - You are about to drop the column `available` on the `BudgetItems` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,month]` on the table `BudgetMonth` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `goal` to the `BudgetItems` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BudgetItems" DROP COLUMN "amount",
DROP COLUMN "available",
ADD COLUMN     "goal" INTEGER NOT NULL,
ADD COLUMN     "remaining" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "BudgetMonth_userId_month_key" ON "BudgetMonth"("userId", "month");
