// config/index.js
require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV || "development",
  // Email Config
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_SECURE: process.env.EMAIL_SECURE === "true",
  EMAIL_SERVICE: process.env.EMAIL_SERVICE, // e.g., 'gmail'
  EMAIL_FROM: process.env.EMAIL_FROM || '"Task Master App" <no-reply@example.com>',
};