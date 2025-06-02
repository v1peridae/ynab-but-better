/*
  Warnings:

  - You are about to drop the column `refreshTokenId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `BudgetItems` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReccurringTransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BudgetItems" DROP CONSTRAINT "BudgetItems_budgetMonthId_fkey";

-- DropForeignKey
ALTER TABLE "BudgetItems" DROP CONSTRAINT "BudgetItems_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "ReccurringTransaction" DROP CONSTRAINT "ReccurringTransaction_accountId_fkey";

-- DropForeignKey
ALTER TABLE "ReccurringTransaction" DROP CONSTRAINT "ReccurringTransaction_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "ReccurringTransaction" DROP CONSTRAINT "ReccurringTransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_refreshTokenId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "refreshTokenId";

-- DropTable
DROP TABLE "BudgetItems";

-- DropTable
DROP TABLE "ReccurringTransaction";

-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" SERIAL NOT NULL,
    "goal" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "budgetMonthId" INTEGER NOT NULL,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringTransaction" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "userId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "categoryId" INTEGER,
    "lastExecuted" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RecurringTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetItem_budgetMonthId_categoryId_key" ON "BudgetItem"("budgetMonthId", "categoryId");

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_budgetMonthId_fkey" FOREIGN KEY ("budgetMonthId") REFERENCES "BudgetMonth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
