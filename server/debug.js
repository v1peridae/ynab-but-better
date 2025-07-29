// Simple debugging script to test server startup
const express = require("express");
const app = express();

console.log("🔍 Debug: Starting minimal server...");
console.log("📊 Environment variables:");
console.log("  - PORT:", process.env.PORT);
console.log("  - NODE_ENV:", process.env.NODE_ENV);
console.log("  - DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
console.log("  - JWT_SECRET:", process.env.JWT_SECRET ? "SET" : "NOT SET");
console.log("  - FRONTEND_URL:", process.env.FRONTEND_URL ? "SET" : "NOT SET");

// Simple endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Debug server running",
    timestamp: new Date().toISOString(),
    env: {
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      JWT_SECRET_SET: !!process.env.JWT_SECRET,
      FRONTEND_URL_SET: !!process.env.FRONTEND_URL,
    },
  });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Debug server running on port ${port}`);
  console.log(`🔍 Test with: curl http://localhost:${port}/`);
});

// Handle errors
app.on("error", (error) => {
  console.error("❌ Debug server error:", error);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled rejection:", reason);
});
