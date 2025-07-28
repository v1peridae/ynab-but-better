//part of this is clearly vibecoded because i couldnt figure out how to do it myself please dont jump me yall :sob:
const express = require("express");
const app = express();
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { validationResult, body, param } = require("express-validator");
const { router: authRouter } = require("./auth");

app.use(express.json());

if (process.env.NODE_ENV !== "test") {
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
    })
  );

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
} else {
  app.use(cors());
}

app.use("/auth", authRouter);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "server running",
  });
});

app.get("/health/detailed", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    console.error("health check failed:", error);
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "DB connection failed",
    });
  }
});

function verifyAccountOwner(req, res, next) {
  const accountId = Number(req.params.id);
  prisma.account
    .findUnique({
      where: { id: accountId },
    })
    .then((account) => {
      if (!account || account.userId !== req.user.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      next();
    })
    .catch(() => res.status(500).json({ error: "Internal Server Error" }));
}

function verifyTransactionOwner(req, res, next) {
  const transactionId = Number(req.params.id);
  prisma.transaction
    .findUnique({
      where: { id: transactionId },
    })
    .then((transaction) => {
      if (!transaction || transaction.userId !== req.user.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      next();
    })
    .catch(() => res.status(500).json({ error: "Internal Server Error" }));
}

function verifyAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "no token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ error: "invalid token" });
  }
}

app.get("/accounts", verifyAuth, async (req, res) => {
  const accounts = await prisma.account.findMany({
    where: { userId: req.user.userId },
  });
  res.json(accounts);
});

async function applyExpenseDelta(transaction, userId, categoryId, dateIso, deltaCents) {
  if (deltaCents === 0 || !categoryId) return;
  const month = dateIso.slice(0, 7);
  const abs = Math.abs(deltaCents);

  const budgetMonth = await transaction.budgetMonth.upsert({
    where: { userId_month: { userId, month } },
    update: {},
    create: { userId, month },
  });

  await transaction.budgetItem.upsert({
    where: { budgetMonthId_categoryId: { budgetMonthId: budgetMonth.id, categoryId } },
    update: {
      spent: { increment: abs * (deltaCents < 0 ? 1 : -1) },
      available: { decrement: abs * (deltaCents < 0 ? 1 : -1) },
    },
    create: {
      budgetMonthId: budgetMonth.id,
      categoryId,
      goal: 0,
      amount: 0,
      spent: deltaCents < 0 ? abs : 0,
      available: deltaCents < 0 ? -abs : 0,
    },
  });
}

app.post("/transactions", verifyAuth, async (req, res) => {
  const { amount, accountId, description, categoryId } = req.body;
  if (amount < 0) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }
    if (account.balance + amount < 0) {
      return res.status(400).json({ error: "Insufficient funds in the account." });
    }
  }

  const created = await prisma.$transaction(async (dbTransaction) => {
    const transactionRecord = await dbTransaction.transaction.create({
      data: { amount, accountId, description, categoryId, userId: req.user.userId },
    });

    await dbTransaction.account.update({
      where: { id: accountId },
      data: { balance: { increment: amount } },
    });

    if (categoryId && amount < 0) {
      await applyExpenseDelta(dbTransaction, req.user.userId, categoryId, transactionRecord.date.toISOString(), amount);
    }
    return transactionRecord;
  });

  res.status(201).json({ message: "Transaction Created", transactionId: created.id });
});

app.patch("/transactions/:id", [verifyAuth, verifyTransactionOwner], async (req, res) => {
  const { amount, accountId, description, categoryId } = req.body;
  const id = Number(req.params.id);

  await prisma.$transaction(async (dbTransaction) => {
    const originalTransaction = await dbTransaction.transaction.findUnique({ where: { id } });
    if (!originalTransaction) throw new Error("Transaction not found");

    await dbTransaction.account.update({
      where: { id: originalTransaction.accountId },
      data: { balance: { decrement: originalTransaction.amount } },
    });
    if (originalTransaction.categoryId && originalTransaction.amount < 0) {
      await applyExpenseDelta(
        dbTransaction,
        req.user.userId,
        originalTransaction.categoryId,
        originalTransaction.date.toISOString(),
        -originalTransaction.amount
      );
    }

    const updatedTransaction = await dbTransaction.transaction.update({
      where: { id },
      data: { amount, accountId, description, categoryId },
    });

    await dbTransaction.account.update({
      where: { id: accountId },
      data: { balance: { increment: amount } },
    });
    if (categoryId && amount < 0) {
      await applyExpenseDelta(dbTransaction, req.user.userId, categoryId, updatedTransaction.date.toISOString(), amount);
    }
  });

  res.json({ message: "Transaction Updated" });
});

app.delete("/transactions/:id", [verifyAuth, verifyTransactionOwner], async (req, res) => {
  const id = Number(req.params.id);

  await prisma.$transaction(async (dbTransaction) => {
    const transactionRecord = await dbTransaction.transaction.delete({ where: { id } });

    await dbTransaction.account.update({
      where: { id: transactionRecord.accountId },
      data: { balance: { decrement: transactionRecord.amount } },
    });

    if (transactionRecord.categoryId && transactionRecord.amount < 0) {
      await applyExpenseDelta(
        dbTransaction,
        req.user.userId,
        transactionRecord.categoryId,
        transactionRecord.date.toISOString(),
        -transactionRecord.amount
      );
    }
  });

  res.status(204).send();
});

app.post("/accounts", verifyAuth, async (req, res) => {
  const { name, balance } = req.body;
  const account = await prisma.account.create({
    data: { name, balance, userId: req.user.userId },
  });
  res.status(201).json({ message: "Account Created", accountId: account.id });
});

app.patch("/accounts/:id", [verifyAuth, verifyAccountOwner], async (req, res) => {
  const { name, balance } = req.body;
  const account = await prisma.account.update({
    where: { id: Number(req.params.id) },
    data: { name, balance },
  });
  res.json(account);
});

app.delete("/accounts/:id", [verifyAuth, verifyAccountOwner], async (req, res) => {
  await prisma.account.delete({
    where: { id: Number(req.params.id) },
  });
  res.json({ message: "Account Deleted" });
});

app.get("/user/dashboard", verifyAuth, async (req, res) => {
  // 1️⃣  Cash on hand
  const accounts = await prisma.account.findMany({ where: { userId: req.user.userId } });
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const month = new Date().toISOString().slice(0, 7);
  const startOfMonth = new Date(`${month}-01`);
  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);

  const monthlyExpenses = await prisma.transaction.findMany({
    where: {
      userId: req.user.userId,
      date: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
      amount: { lt: 0 },
    },
  });

  const totalSpent = Math.abs(monthlyExpenses.reduce((sum, t) => sum + t.amount, 0));
  const budgetMonth = await prisma.budgetMonth.findFirst({
    where: { userId: req.user.userId, month },
    include: { items: { select: { goal: true } } },
  });
  const totalBudgeted = budgetMonth ? budgetMonth.items.reduce((sum, i) => sum + i.goal, 0) : 0;
  const unassigned = totalBalance - totalSpent;
  try {
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: req.user.userId },
      orderBy: { date: "desc" },
      take: 7,
      include: { account: true, category: true },
    });

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const thisWeeksTransactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.userId,
        date: { gte: oneWeekAgo },
      },
      include: { category: true },
    });

    const expenseTransactions = thisWeeksTransactions.filter((t) => t.amount < 0);
    const topPurchase =
      expenseTransactions.length > 0
        ? expenseTransactions.reduce((prev, current) => (prev.amount < current.amount ? prev : current))
        : null;

    const categorySpending = {};
    thisWeeksTransactions.forEach((transaction) => {
      if (transaction.categoryId && transaction.category && transaction.amount < 0) {
        const categoryName = transaction.category.name;
        if (!categorySpending[categoryName]) {
          categorySpending[categoryName] = 0;
        }
        categorySpending[categoryName] += Math.abs(transaction.amount);
      }
    });

    let topCategory = null;
    let maxSpending = 0;

    for (const [category, amount] of Object.entries(categorySpending)) {
      if (amount > maxSpending) {
        maxSpending = amount;
        topCategory = category;
      }
    }

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const lastWeekTransactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.userId,
        date: { gte: twoWeeksAgo, lt: oneWeekAgo },
      },
    });

    const thisWeeksTotal = thisWeeksTransactions.reduce((acc, transaction) => acc + transaction.amount, 0);
    const lastWeekTotal = lastWeekTransactions.reduce((acc, transaction) => acc + transaction.amount, 0);

    let weeklyPercentChange = 0;
    if (lastWeekTotal > 0) {
      weeklyPercentChange = Math.round(((thisWeeksTotal - lastWeekTotal) / lastWeekTotal) * 100);
    }

    res.json({
      accounts,
      totalBalance,
      totalSpent,
      unassigned,
      recentTransactions,
      summary: {
        topPurchase: topPurchase ? topPurchase.description : "Unknown",
        topCategory: topCategory || "Unknown",
        weeklyChangePercent: weeklyPercentChange,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/transactions", verifyAuth, async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user.userId },
    include: { account: true, category: true },
  });
  res.json(transactions);
});

app.get("/categories", verifyAuth, async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { userId: req.user.userId },
  });
  res.json(categories);
});

app.post("/categories", verifyAuth, async (req, res) => {
  const { name, group } = req.body;
  const category = await prisma.category.create({
    data: { name, group, userId: req.user.userId },
  });
  res.status(201).json(category);
});

app.get("/budget/:month", verifyAuth, async (req, res) => {
  const month = req.params.month;
  try {
    const budgetMonth = await prisma.budgetMonth.findFirst({
      where: {
        month: month,
        userId: req.user.userId,
      },
    });

    if (!budgetMonth) {
      return res.json([]);
    }

    const items = await prisma.budgetItem.findMany({
      where: {
        budgetMonthId: budgetMonth.id,
      },
      include: { category: true },
    });

    res.json(items);
  } catch (error) {
    console.error("Error fetching budget items:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/user/onboarding", verifyAuth, async (req, res) => {
  const { name, accounts, categories } = req.body;
  try {
    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        name,
      },
    });

    if (accounts && accounts.length > 0) {
      for (const account of accounts) {
        await prisma.account.create({
          data: { name: account.name, balance: account.balance, userId: req.user.userId },
        });
      }
    }

    if (categories && categories.length > 0) {
      for (const category of categories) {
        await prisma.category.create({
          data: { name: category.name, group: category.group || "Other", userId: req.user.userId },
        });
      }
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const existingBudgetMonth = await prisma.budgetMonth.findFirst({
      where: { month: currentMonth, userId: req.user.userId },
    });

    if (!existingBudgetMonth) {
      await prisma.budgetMonth.create({
        data: { month: currentMonth, userId: req.user.userId },
      });
    }
    res.status(200).json({ message: "Onboarding completed successfully" });
  } catch (error) {
    console.error("Error during onboarding:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/budget/:month/categories/:id", verifyAuth, async (req, res) => {
  const { amount } = req.body;
  const month = req.params.month;
  const categoryId = Number(req.params.id);

  const accounts = await prisma.account.findMany({ where: { userId: req.user.userId } });
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const startOfMonth = new Date(`${month}-01`);
  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  const monthlyExpenses = await prisma.transaction.findMany({
    where: {
      userId: req.user.userId,
      date: { gte: startOfMonth, lt: endOfMonth },
      amount: { lt: 0 },
    },
  });

  const totalSpent = Math.abs(monthlyExpenses.reduce((sum, t) => sum + t.amount, 0));
  const unspentCash = totalBalance - totalSpent;
  const [
    {
      _sum: { goal: alreadyAssigned = 0 },
    },
  ] = await Promise.all([
    prisma.budgetItem.aggregate({
      _sum: { goal: true },
      where: {
        budgetMonth: { month, userId: req.user.userId },
        NOT: { categoryId },
      },
    }),
  ]);

  if (alreadyAssigned + amount > unspentCash) {
    return res.status(400).json({
      error: `Cannot assign more than unspent cash. Available: $${unspentCash / 100}, Trying to assign: $${
        (alreadyAssigned + amount) / 100
      }`,
    });
  }

  let budgetMonth = await prisma.budgetMonth.findFirst({
    where: {
      month: month,
      userId: req.user.userId,
    },
  });
  if (!budgetMonth) {
    budgetMonth = await prisma.budgetMonth.create({
      data: {
        month: month,
        userId: req.user.userId,
      },
    });
  }

  const existingItem = await prisma.budgetItem.findUnique({
    where: {
      budgetMonthId_categoryId: {
        budgetMonthId: budgetMonth.id,
        categoryId,
      },
    },
  });

  const spent = existingItem?.spent || 0;
  const item = await prisma.budgetItem.upsert({
    where: {
      budgetMonthId_categoryId: {
        budgetMonthId: budgetMonth.id,
        categoryId,
      },
    },
    update: {
      goal: amount,
      amount: amount,
      available: amount - spent,
    },
    create: {
      budgetMonthId: budgetMonth.id,
      categoryId,
      goal: amount,
      amount,
      spent: 0,
      available: amount,
    },
  });
  res.status(201).json(item);
});

app.delete("/budget/reset", verifyAuth, async (req, res) => {
  try {
    const month = new Date().toISOString().slice(0, 7);
    const budgetMonth = await prisma.budgetMonth.findFirst({
      where: { userId: req.user.userId, month },
    });

    if (budgetMonth) {
      await prisma.budgetItem.deleteMany({
        where: { budgetMonthId: budgetMonth.id },
      });
      await prisma.budgetMonth.delete({
        where: { id: budgetMonth.id },
      });
    }

    res.json({ message: "Budget data reset for current month" });
  } catch (error) {
    console.error("Error resetting budget:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/budget/:month/rollover", verifyAuth, async (req, res) => {
  const month = req.params.month;
  const [yearStr, monthStr] = month.split("-");
  const nextMonth = `${yearStr}-${String(Number(monthStr) + 1).padStart(2, "0")}`;
  const current = await prisma.budgetMonth.findFirst({
    where: {
      month: month,
      userId: req.user.userId,
    },
    include: {
      items: true,
    },
  });
  if (!current) {
    return res.status(404).json({ error: "Current month not found" });
  }
  const next = await prisma.budgetMonth.upsert({
    where: {
      userId_month: {
        userId: req.user.userId,
        month: nextMonth,
      },
    },
    update: {},
    create: {
      month: nextMonth,
      userId: req.user.userId,
    },
  });
  for (const item of current.items) {
    const rolloverAmount = item.available;
    if (rolloverAmount <= 0) continue;
    await prisma.budgetItem.upsert({
      where: {
        budgetMonthId_categoryId: {
          budgetMonthId: next.id,
          categoryId: item.categoryId,
        },
      },
      update: {
        goal: { increment: 0 },
        amount: { increment: 0 },
        available: { increment: rolloverAmount },
      },
      create: {
        budgetMonthId: next.id,
        goal: 0,
        amount: 0,
        available: rolloverAmount,
        spent: 0,
        categoryId: item.categoryId,
      },
    });
  }
  res.json({ message: "Rollover successful" });
});

app.patch("/categories/:id", [verifyAuth, verifyAccountOwner], async (req, res) => {
  const { name, group } = req.body;
  const categoryId = Number(req.params.id);
  try {
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { name, group },
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/categories/:id", [verifyAuth, verifyAccountOwner], async (req, res) => {
  const categoryId = Number(req.params.id);
  try {
    const transactionsUsingCategory = await prisma.transaction.count({
      where: { categoryId },
    });
    const budgetItemsUsingCategory = await prisma.budgetItem.count({
      where: { categoryId },
    });
    if (transactionsUsingCategory > 0 || budgetItemsUsingCategory > 0) {
      return res.status(400).json({ error: "Cannot delete category with transactions or budget items" });
    }
    await prisma.category.delete({
      where: { id: categoryId },
    });
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/goals", verifyAuth, async (req, res) => {
  const goals = await prisma.goal.findMany({
    where: { userId: req.user.userId },
  });
  res.json(goals);
});

app.post("/goals", verifyAuth, async (req, res) => {
  const { name, targetAmount, dueDate } = req.body;
  const goal = await prisma.goal.create({
    data: { name, targetAmount, dueDate: dueDate ? new Date(dueDate) : null, userId: req.user.userId },
  });
  res.status(201).json(goal);
});

app.patch("/goals/:id", verifyAuth, async (req, res) => {
  const { name, targetAmount, currentAmount, dueDate } = req.body;
  const goalId = Number(req.params.id);
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
  });

  if (!goal || goal.userId !== req.user.userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const updateGoal = await prisma.goal.update({
    where: { id: goalId },
    data: {
      name,
      targetAmount,
      currentAmount,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  res.json(updateGoal);
});

app.delete("/goals/:id", verifyAuth, async (req, res) => {
  const goalId = Number(req.params.id);
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
  });

  if (!goal || goal.userId !== req.user.userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  await prisma.goal.delete({
    where: { id: goalId },
  });
  res.json({ message: "Goal deleted" });
});

app.get("/reports/spending", verifyAuth, async (req, res) => {
  const { startDate, endDate } = req.query;
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: req.user.userId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      amount: {
        lt: 0,
      },
    },
    include: { category: true },
  });
  const byCategory = transactions.reduce((acc, transaction) => {
    const category = transaction.category?.name || "Uncategorized";
    if (!acc[category]) acc[category] = 0;
    acc[category] += transaction.amount;
    return acc;
  }, {});
  res.json({
    byCategory,
    totalSpent: transactions.reduce((acc, transaction) => acc + transaction.amount, 0),
    transactions,
  });
});

app.get("/reports/net-worth", verifyAuth, async (req, res) => {
  const accounts = await prisma.account.findMany({
    where: { userId: req.user.userId },
  });
  const netWorth = accounts.reduce((acc, account) => acc + account.balance, 0);
  res.json({
    netWorth,
    accounts: accounts.map((a) => ({ id: a.id, name: a.name, balance: a.balance })),
  });
});

app.get("/report/trends", verifyAuth, async (req, res) => {
  const { months = 6 } = req.query;
  const startDate = new Date();
  const endDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: req.user.userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const byMonth = transactions.reduce((acc, transaction) => {
    const month = transaction.date.toISOString().slice(0, 7);
    if (!acc[month]) acc[month] = { income: 0, expenses: 0 };
    if (transaction.amount > 0) {
      acc[month].income += transaction.amount;
    } else {
      acc[month].expenses += transaction.amount;
    }
    return acc;
  }, {});
  res.json(byMonth);
});

app.patch("/user/password", verifyAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  });

  const passwordMatches = await bcrypt.compare(oldPassword, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid old password" });
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.user.userId },
    data: { password: hashedPassword },
  });
  res.json({ message: "Password updated" });
});

app.patch("/user/preferences", verifyAuth, async (req, res) => {
  const { currency, dateFormat, theme, notifications } = req.body;
  const currentUser = await prisma.user.findUnique({
    where: { id: req.user.userId },
  });

  const currentPreferences = currentUser?.preferences || {};
  const updatedPreferences = {
    ...currentPreferences,
    ...(currency !== undefined && { currency }),
    ...(dateFormat !== undefined && { dateFormat }),
    ...(theme !== undefined && { theme }),
    ...(notifications !== undefined && { notifications }),
  };

  const user = await prisma.user.update({
    where: { id: req.user.userId },
    data: { preferences: updatedPreferences },
  });

  res.json({ message: "Preferences updated" });
});

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/profile-pictures";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `user-${req.user.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

app.use("/uploads", express.static("uploads"));

app.get("/user/profile", verifyAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { email: true, name: true, preferences: true, profilePicture: true },
  });
  res.json(user);
});

app.patch("/user/profile", verifyAuth, upload.single("profilePicture"), async (req, res) => {
  try {
    const { name } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (req.file) {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { profilePicture: true },
      });
      if (currentUser.profilePicture) {
        const oldFilePath = currentUser.profilePicture.replace("/uploads/", "");
        const fullPath = path.join("uploads", oldFilePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      updateData.profilePicture = `/uploads/${req.file.path.replace("uploads/", "")}`;
    }
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
      select: { email: true, name: true, preferences: true, profilePicture: true },
    });
    res.json({ message: "Updates profile pic", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.delete("/user/profile-picture", verifyAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { profilePicture: true },
    });
    if (user.profilePicture) {
      const filePath = user.profilePicture.replace("/uploads/", "");
      const fullPath = path.join("uploads", filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      await prisma.user.update({
        where: { id: req.user.userId },
        data: { profilePicture: null },
      });
      res.json({ message: "Profile picture deleted" });
    } else {
      res.json({ message: "No profile picture to delete" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete profile picture" });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: "Internal Server Error" });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(process.env.PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
}
module.exports = app;
