const express = require("express");
const app = express();
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();
const cors = require("cors");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const { validationResult, body, param } = require("express-validator");

app.use(express.json());

if (process.env.NODE_ENV !== "test") {
  app.use(helmet());
  app.use(xss());
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

app.post("/signup", [body("email").isEmail().normalizeEmail(), body("password").isLength({ min: 8 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        categories: {
          create: [
            { name: "Groceries", group: "Essentials" },
            { name: "Transport", group: "Essentials" },
            { name: "Dining Out", group: "Fun" },
          ],
        },
        budgetMonths: {
          create: {
            month: new Date().toISOString().slice(0, 7),
            items: {
              create: [
                { categoryId: 1, amount: 0 },
                { categoryId: 2, amount: 0 },
                { categoryId: 3, amount: 0 },
              ],
            },
          },
        },
      },
    });

    res.status(201).json({ message: "User Created", userId: user.id });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Invalid email" });
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: "Invalid password" });
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  res.json({ token });
});

function auth(req, res, next) {
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

app.get("/accounts", auth, async (req, res) => {
  const accounts = await prisma.account.findMany({
    where: { userId: req.user.userId },
  });
  res.json(accounts);
});

app.post("/transactions", auth, async (req, res) => {
  const { amount, accountId, description, categoryId } = req.body;
  const transaction = await prisma.transaction.create({
    data: { amount, accountId, description, categoryId, userId: req.user.userId },
  });
  await prisma.account.update({
    where: { id: accountId },
    data: { balance: { increment: amount } },
  });
  if (categoryId) {
    const transactionDate = transaction.date;
    const transactionMonth = new Date(transactionDate).toISOString().slice(0, 7);
    let budgetMonth = await prisma.budgetMonth.findFirst({
      where: {
        month: transactionMonth,
        userId: req.user.userId,
      },
    });
    if (!budgetMonth) {
      budgetMonth = await prisma.budgetMonth.create({
        data: {
          month: transactionMonth,
          userId: req.user.userId,
        },
      });
    }
    const budgetItem = await prisma.budgetItem.upsert({
      where: {
        budgetMonthId_categoryId: {
          budgetMonthId: budgetMonth.id,
          categoryId: categoryId,
        },
      },
      update: {
        spent: { increment: amount },
        available: { decrement: amount },
      },
      create: {
        budgetMonthId: budgetMonth.id,
        categoryId: categoryId,
        amount: 0,
        spent: amount,
        available: -amount,
      },
    });
  }

  res.status(201).json({ message: "Transaction Created", transactionId: transaction.id });
});

app.post("/accounts", auth, async (req, res) => {
  const { name, balance } = req.body;
  const account = await prisma.account.create({
    data: { name, balance, userId: req.user.userId },
  });
  res.status(201).json({ message: "Account Created", accountId: account.id });
});

app.patch("/accounts/:id", [auth, verifyAccountOwner], async (req, res) => {
  const { name, balance } = req.body;
  const account = await prisma.account.update({
    where: { id: Number(req.params.id) },
    data: { name, balance },
  });
  res.json(account);
});

app.delete("/accounts/:id", [auth, verifyAccountOwner], async (req, res) => {
  await prisma.account.delete({
    where: { id: Number(req.params.id) },
  });
  res.json({ message: "Account Deleted" });
});

app.get("/transactions", auth, async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user.userId },
  });
  res.json(transactions);
});

app.patch("/transactions/:id", [auth, verifyTransactionOwner], async (req, res) => {
  const { amount, accountId, description } = req.body;
  const transaction = await prisma.transaction.update({
    where: { id: Number(req.params.id) },
    data: { amount, accountId, description },
  });
  res.json(transaction);
});

app.delete("/transactions/:id", [auth, verifyTransactionOwner], async (req, res) => {
  await prisma.transaction.delete({
    where: { id: Number(req.params.id) },
  });
  res.status(204).send();
});

app.get("/categories", auth, async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { userId: req.user.userId },
  });
  res.json(categories);
});

app.post("/categories", auth, async (req, res) => {
  const { name, group } = req.body;
  const category = await prisma.category.create({
    data: { name, group, userId: req.user.userId },
  });
  res.status(201).json(category);
});

app.get("/budget/:month", auth, async (req, res) => {
  const month = req.params.month;
  const items = await prisma.budgetItem.findMany({
    where: {
      month,
      userId: req.user.userId,
    },
    include: { category: true },
  });
  res.json(items);
});

app.post("/budget/:month/categories/:id", auth, async (req, res) => {
  const { amount } = req.body;
  const month = req.params.month;
  const categoryId = Number(req.params.id);

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
      amount: amount,
      available: amount - spent,
    },
    create: {
      budgetMonthId: budgetMonth.id,
      categoryId,
      amount,
      spent: 0,
      available: amount,
    },
  });
  res.status(201).json(item);
});

app.post("/budget/:month/rollover", auth, async (req, res) => {
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
        amount: { increment: 0 },
        available: { increment: rolloverAmount },
      },
      create: {
        budgetMonthId: next.id,
        amount: 0,
        available: rolloverAmount,
        categoryId: item.categoryId,
      },
    });
  }
  res.json({ message: "Rollover successful" });
});

app.patch("/categories/:id", [auth, verifyAccountOwner], async (req, res) => {
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

app.delete("/categories/:id", [auth, verifyAccountOwner], async (req, res) => {
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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
}

module.exports = app;
