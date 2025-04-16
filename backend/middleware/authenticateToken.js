// middleware/authenticateToken.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config"); // Import secret from central config

const authenticateToken = (req, res, next) => {
  // console.log(`\n--- authenticateToken START for ${req.method} ${req.originalUrl} ---`); // Optional: Keep for debugging
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (token == null) {
    // console.log("authenticateToken: No token - Sending 401");
    return res.status(401).json({ message: "Authentication token required" });
  }

  // console.log("authenticateToken: Verifying token...");
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
    //   console.log("authenticateToken: Verification FAILED:", err.message);
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      }
      return res.status(403).json({ message: "Invalid token" }); // Forbidden for other errors
    }

    if (!decoded || !decoded.userId) {
    //   console.log("authenticateToken: Verification OK but userId missing - Sending 403");
      return res.status(403).json({ message: "Invalid token payload" });
    }

    // console.log("authenticateToken: Verification OK - User ID:", decoded.userId);
    req.user = decoded; // Attach payload (e.g., { userId: '...', username: '...' }) to request
    // console.log("authenticateToken: Calling next()...");
    next();
  });
  // console.log("--- authenticateToken END (sync part) ---"); // Optional: Keep for debugging
};

module.exports = authenticateToken;