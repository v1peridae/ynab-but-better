const express = require("express");
const app = express();
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();
const { validationResult, body, param } = require("express-validator");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "no token provided" });
  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decode;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

router.post("/signup", [body("email").isEmail().withMessage("Invalid email"), body("password").isLength({ min: 8 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

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

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        expiresAt: expiresAt,
        userId: user.id,
      },
    });

    res.status(201).json({
      message: "Account created successfully",
      userId: user.id,
      token,
      refreshToken,
      expiresAt,
    });
  } catch (error) {
    console.error("Error signing up", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        expiresAt: expiresAt,
        userId: user.id,
      },
    });

    res.json({
      token,
      refreshToken,
      expiresAt,
    });
  } catch (error) {
    console.error("Error logging in", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token required" });
  }

  try {
    const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken }, include: { user: true } });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const accessToken = jwt.sign({ userId: storedToken.userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token: accessToken });
  } catch (error) {
    console.error("Error refreshing token", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token required" });
  }
  try {
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error logging out", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = {
  router,
  auth,
};
