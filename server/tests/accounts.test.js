const request = require("supertest");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const app = require("../server");

jest.mock("@prisma/client", () => {
  const mockPrismaClient = {
    account: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

jest.mock("jsonwebtoken");

const prisma = new PrismaClient();
const userId = 1;
const validToken = "valid-token";

beforeEach(async () => {
  jest.clearAllMocks();
  jwt.verify.mockImplementation((token, secret) => {
    if (token === validToken && secret === "test-secret") {
      return { userId };
    }
    throw new Error("Invalid token");
  });

  prisma.account.findMany.mockResolvedValue([]);
  prisma.account.create.mockResolvedValue({ id: 1, name: "Test Account", balance: 0, userId });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("Account API Endpoints", () => {
  describe("GET /accounts", () => {
    test("should return all accounts for the user", async () => {
      const mockAccounts = [
        { id: 1, name: "Account 1", balance: 1000, userId },
        { id: 2, name: "Account 2", balance: 2000, userId },
      ];
      prisma.account.findMany.mockResolvedValue(mockAccounts);

      const response = await request(app).get("/accounts").set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAccounts);
      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });
  test("should return 401 if no token is provided", async () => {
    const response = await request(app).get("/accounts");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "no token" });
  });

  describe("POST /accounts", () => {
    test("should create a new account", async () => {
      const newAccount = { name: "New Account", balance: 1000 };
      const createdAccount = { id: 3, ...newAccount, userId };

      prisma.account.create.mockResolvedValue(createdAccount);

      const response = await request(app)
        .post("/accounts")
        .set("Authorization", `Bearer ${validToken}`)
        .set("Content-Type", "application/json")
        .send(newAccount);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: "Account Created",
        accountId: createdAccount.id,
      });
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: { ...newAccount, userId },
      });
    });
  });
});
