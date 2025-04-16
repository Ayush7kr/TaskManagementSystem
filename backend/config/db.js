// config/db.js
const mongoose = require("mongoose");
const { MONGODB_URI } = require("./index"); // Import URI from central config

const connectDB = async () => {
  if (!MONGODB_URI) {
    console.error(
      "FATAL ERROR: MONGODB_URI is not defined in the .env file."
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Successfully connected to MongoDB");

    // Optional: Enable Mongoose debugging if needed
    // mongoose.set('debug', true);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;