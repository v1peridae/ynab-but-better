const request = require("supertest");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const app = require("../server");

jest.mock("@prisma/client", () => {
  const mockPrismaClient = {
    account: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

jest.mock("jsonwebtoken");

const prisma = new PrismaClient();
const userId = 1;
const validToken = "valid-token";

beforeEach(() => {
  jest.clearAllMocks();
  jwt.verify.mockReturnValue({ userId });
});

describe("Account API Endpoints", () => {
  describe("GET /accounts", () => {
    test("should return all accounts for the user", async () => {
      const mockAccounts = [
        { id: 1, name: "Account 1", balance: 1000 },
        { id: 2, name: "Account 2", balance: 2000 },
      ];
      prisma.account.findMany.mockResolvedValue(mockAccounts);
      const response = await request(app).get("/accounts").set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAccounts);
      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: {
          userId,
        },
      });
    });
    test("should return 401 if no token is provided", async () => {
      const response = await request(app).get("/accounts");
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "no token" });
    });
  });

  describe("PATCH/ accounts/:id", () => {
    test("should update an account", async () => {
      const accountId = 1;
      const updateData = {
        name: "Updated Account",
        balance: 1500,
      };
      const updatedAccount = { id: accountId, ...updateData, userId };
      prisma.account.update.mockResolvedValue(updatedAccount);
      prisma.account.findUnique.mockResolvedValue({ id: accountId, ...updateData, userId });
      const response = await request(app).patch(`/accounts/${accountId}`).set("Authorization", `Bearer ${validToken}`).send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedAccount);
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: accountId },
        data: updateData,
      });
    });

    test("should return 403 when trying to update another user's account", async () => {
      const accountId = 2;

      prisma.account.findUnique.mockResolvedValue({ id: accountId, name: "Another User's Account", balance: 2000, userId: 2 });

      const updateData = { name: "Updated Name" };
      const response = await request(app).patch(`/accounts/${accountId}`).set("Authorization", `Bearer ${validToken}`).send(updateData);
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: "Unauthorized" });
      expect(prisma.account.update).not.toHaveBeenCalled();
    });
  });
});

describe("DELETE /accounts/:id", () => {
  test("should delete an account", async () => {
    const accountId = 1;

    prisma.account.findUnique.mockResolvedValue({ id: accountId, userId });
    prisma.account.delete.mockResolvedValue({ id: accountId });

    const response = await request(app).delete(`/accounts/${accountId}`).set("Authorization", `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Account Deleted" });
    expect(prisma.account.delete).toHaveBeenCalledWith({ where: { id: accountId } });
  });

  test("should return 403 when trying to delete another user's account", async () => {
    const accountId = 2;

    prisma.account.findUnique.mockResolvedValue({ id: accountId, userId: 20 });
    const response = await request(app).delete(`/accounts/${accountId}`).set("Authorization", `Bearer ${validToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Unauthorized" });
    expect(prisma.account.delete).not.toHaveBeenCalled();
  });

  describe("POST /accounts", () => {
    test("should create a new account", async () => {
      const newAccount = {
        name: "Test Account",
        balance: 1000,
      };
      const createdAccount = { id: 3, ...newAccount, userId };
      prisma.account.create.mockResolvedValue(createdAccount);
      const response = await request(app).post("/accounts").set("Authorization", `Bearer ${validToken}`).send(newAccount);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: "Account Created",
        accountId: createdAccount.id,
      });
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          ...newAccount,
          userId,
        },
      });
    });
  });
});
module.exports = app;
