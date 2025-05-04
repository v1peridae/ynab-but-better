-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetMonth" (
    "id" SERIAL NOT NULL,
    "month" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "BudgetMonth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetItems" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "spent" INTEGER NOT NULL DEFAULT 0,
    "available" INTEGER NOT NULL DEFAULT 0,
    "categoryId" INTEGER NOT NULL,
    "budgetMonthId" INTEGER NOT NULL,

    CONSTRAINT "BudgetItems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetItems_budgetMonthId_categoryId_key" ON "BudgetItems"("budgetMonthId", "categoryId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetMonth" ADD CONSTRAINT "BudgetMonth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItems" ADD CONSTRAINT "BudgetItems_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItems" ADD CONSTRAINT "BudgetItems_budgetMonthId_fkey" FOREIGN KEY ("budgetMonthId") REFERENCES "BudgetMonth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
