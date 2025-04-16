// app.js
const express = require("express");
const cors = require("cors");
const config = require('./config'); // Load config (ensures dotenv runs)
const connectDB = require('./config/db');
const mainApiRouter = require('./routes'); // Import the main API router from routes/index.js
// Note: Email transporter is initialized in config/email.js when imported

// --- Environment Variable Check ---
if (!config.MONGODB_URI || !config.JWT_SECRET) {
  console.error(
    "FATAL ERROR: MONGODB_URI and JWT_SECRET must be defined in the .env file."
  );
  process.exit(1);
}

// --- Connect to Database ---
// Call connectDB - it handles connection and logging internally
connectDB();

// --- Create Express App ---
const app = express();

// --- Core Middleware ---
app.use(cors()); // Enable CORS for all origins (adjust in production)
app.use(express.json()); // Parse JSON request bodies

// --- Simple Root Route ---
app.get("/", (req, res) => {
  res.send("Task Manager API is running!");
});

// --- Mount API Routes ---
// All API endpoints will be prefixed with /api
app.use('/api', mainApiRouter);

// --- Global Error Handling Middleware (Keep last) ---
// Catches errors passed via next(err) or unhandled synchronous errors in routes
app.use((err, req, res, next) => {
  console.error("--- UNHANDLED ERROR ---");
  console.error("Status:", err.status || 500);
  console.error("Message:", err.message || "Internal Server Error");
  console.error(err.stack || "No stack trace available");

  // Avoid sending stack trace in production
  const responseError = {
    message: err.message || "Something went wrong on the server!",
    ...(config.NODE_ENV === "development" && { stack: err.stack }), // Include stack only in dev
  };

  const statusCode = err.status || 500; // Use error status or default to 500
  res.status(statusCode).json(responseError);
});

module.exports = app; // Export the configured app instance