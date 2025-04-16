// index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { format } = require("date-fns");

// --- Basic Configuration ---
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// --- Middleware ---
app.use(cors()); // Enable CORS for all origins (adjust in production if needed)
app.use(express.json()); // Parse JSON bodies (needs to be before routes)

// --- Environment Variable Check ---
if (!MONGODB_URI || !JWT_SECRET) {
  console.error(
    "FATAL ERROR: MONGODB_URI and JWT_SECRET must be defined in the .env file."
  );
  process.exit(1);
}

// --- MongoDB Connection ---
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// --- Enable Mongoose Debugging (Optional, but helpful if DB calls hang) ---
// mongoose.set('debug', true); // Uncomment this line to see Mongoose queries in console

// --- Email Transporter Setup ---
let transporter;

// Use Ethereal for testing if no real service is configured
// OR if explicitly in development without real credentials
const useRealEmailService = process.env.EMAIL_HOST || process.env.EMAIL_SERVICE;

if (process.env.NODE_ENV === "development" && !useRealEmailService) {
  // Generate test SMTP service account from ethereal.email
  // Only needed once per application startup
  nodemailer.createTestAccount((err, account) => {
    if (err) {
      console.error("Failed to create a testing account. " + err.message);
      return process.exit(1);
    }
    console.log("Ethereal test account credentials obtained");
    // Create a Nodemailer transporter object using the Ethereal SMTP transport
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user, // generated ethereal user
        pass: account.pass, // generated ethereal password
      },
    });
    console.log("Nodemailer configured with Ethereal for testing.");
    console.log(
      `Preview emails at: ${nodemailer.getTestMessageUrl(
        null
      )} (URL will appear after first email sent)`
    ); // Log base URL
  });
} else if (useRealEmailService) {
  // Configure for a real service (Gmail, SendGrid SMTP, etc.)
  let transportOptions;
  if (process.env.EMAIL_SERVICE === "gmail") {
    transportOptions = {
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Password for Gmail
      },
    };
    console.log("Nodemailer configured with Gmail service.");
  } else {
    // Assume generic SMTP
    transportOptions = {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587", 10), // Default to 587
      secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };
    console.log(
      `Nodemailer configured with SMTP host: ${process.env.EMAIL_HOST}`
    );
  }

  transporter = nodemailer.createTransport(transportOptions);

  // Verify connection configuration (optional but recommended)
  transporter.verify(function (error, success) {
    if (error) {
      console.error("Nodemailer configuration error:", error);
    } else {
      console.log("Nodemailer is ready to send real emails.");
    }
  });
} else {
  console.warn(
    "WARN: Email service is not configured. Emails will not be sent."
  );
  // Create a dummy transporter that does nothing to prevent errors later
  transporter = {
    sendMail: (options, callback) => {
      console.log(
        "Dummy transporter: Email sending skipped as service is not configured."
      );
      // Simulate success immediately for the callback pattern if needed, or return a resolved promise
      if (callback) callback(null, { messageId: "dummy-" + Date.now() });
      return Promise.resolve({ messageId: "dummy-" + Date.now() });
    },
  };
}

// --- Helper Function to Send Task Creation Email ---
async function sendTaskCreationEmail(user, task) {
  if (!transporter) {
    console.error("Email transporter is not initialized. Cannot send email.");
    return; // Exit if transporter isn't ready
  }
  if (!user || !user.email) {
    console.error("Cannot send task creation email: User email is missing.");
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Task Master App" <no-reply@example.com>', // Sender address
    to: user.email, // List of receivers
    subject: `✅ New Task Created: ${task.title}`, // Subject line
    text: `Hello ${
      user.username || "User"
    },\n\nA new task has been created for you:\n\nTitle: ${
      task.title
    }\nDescription: ${task.description || "N/A"}\nDue Date: ${format(
      task.dueDate,
      "PPpp"
    )}\nPriority: ${task.priority}\nStatus: ${task.status}\nAssignee: ${
      task.assignee || "N/A"
    }\n\nYou can view your tasks in the Task Master application.\n\nRegards,\nThe Task Master Team`, // Plain text body
    html: `
            <div style="font-family: sans-serif; line-height: 1.6;">
                <h2>Hello ${user.username || "User"},</h2>
                <p>A new task titled "<strong>${
                  task.title
                }</strong>" has been successfully created for you in the Task Master application.</p>
                <h3>Task Details:</h3>
                <ul>
                    <li><strong>Title:</strong> ${task.title}</li>
                    <li><strong>Description:</strong> ${
                      task.description || "N/A"
                    }</li>
                    <li><strong>Due Date:</strong> ${format(
                      task.dueDate,
                      "MMMM d, yyyy 'at' h:mm a"
                    )}</li>
                    <li><strong>Priority:</strong> <span style="text-transform: capitalize;">${
                      task.priority
                    }</span></li>
                    <li><strong>Status:</strong> <span style="text-transform: capitalize;">${task.status.replace(
                      "-",
                      " "
                    )}</span></li>
                    <li><strong>Assignee:</strong> ${
                      task.assignee || "N/A"
                    }</li>
                </ul>
                <p>You can view and manage your tasks by logging into the application.</p>
                <hr>
                <p style="font-size: 0.9em; color: #666;">This is an automated notification. Please do not reply directly to this email.</p>
            </div>
        `, // HTML body
  };

  try {
    console.log(`Attempting to send task creation email to ${user.email}...`);
    let info = await transporter.sendMail(mailOptions);
    console.log("Task creation email sent: %s", info.messageId);
    // Log preview URL if using Ethereal
    if (
      process.env.NODE_ENV === "development" &&
      !useRealEmailService &&
      nodemailer.getTestMessageUrl(info)
    ) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    // Log the error but DO NOT fail the main API request because of email failure
    console.error("Error sending task creation email:", error);
  }
}

// --- User Schema and Model (MODIFIED) ---
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^\S+@\S+\.\S+$/,
    },
    password: { type: String, required: true, minlength: 6 },
    // --- NEW FIELDS ---
    role: {
      type: String,
      enum: ["user", "admin"], // Example roles, adjust as needed
      default: "user", // Default role for new users
    },
    phone: {
      type: String,
      trim: true,
      default: "", // Default empty string
    },
    bio: {
      type: String,
      trim: true,
      default: "", // Default empty string
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: "https://avatar.iran.liara.run/public/boy?username=default", // A default placeholder avatar
    },
  },
  { timestamps: true }
); // Keep timestamps

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = function (candidatePassword) {
  // Ensure bcrypt.compare returns a promise if used directly
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

// --- Task Schema and Model ---
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      minlength: 3,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    priority: {
      type: String,
      required: true,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    assignee: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  console.log(
    `\n--- authenticateToken START for ${req.method} ${req.originalUrl} ---`
  );
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  console.log("authenticateToken: Token found?", !!token);

  if (token == null) {
    console.log("authenticateToken: No token - Sending 401");
    return res.status(401).json({ message: "Authentication token required" });
  }

  console.log("authenticateToken: Verifying token...");
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log(
        "authenticateToken: Verification FAILED - Sending 401/403:",
        err.message
      );
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      }
      return res.status(403).json({ message: "Invalid token" });
    }
    // Ensure the payload structure matches what you expect (e.g., contains userId)
    if (!decoded || !decoded.userId) {
      console.log(
        "authenticateToken: Verification OK but userId missing in payload - Sending 403"
      );
      return res.status(403).json({ message: "Invalid token payload" });
    }
    console.log(
      "authenticateToken: Verification OK - User ID:",
      decoded.userId
    );
    req.user = decoded; // Attach decoded payload (contains userId)
    console.log("authenticateToken: Calling next()...");
    next(); // Pass execution
  });
  console.log("--- authenticateToken END (sync part) ---");
};

// --- API Routes ---

// Root Route
app.get("/", (req, res) => {
  console.log("\n--- GET / ---");
  res.send("Task Manager API is running!");
});

// --- Authentication Routes ---
const authRouter = express.Router();

authRouter.post("/register", async (req, res, next) => {
  // Added next for potential errors in comparePassword if needed
  console.log("\n--- POST /api/auth/register START ---");
  const { username, email, password } = req.body;
  console.log("Register attempt:", { username, email }); // Don't log password

  if (!username || !email || !password) {
    console.log("Register: Missing fields - Sending 400");
    return res
      .status(400)
      .json({ message: "Username, email, and password are required." });
  }
  if (password.length < 6) {
    console.log("Register: Password too short - Sending 400");
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long." });
  }

  try {
    console.log("Register: Checking existing user...");
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log("Register: User exists - Sending 400");
      return res
        .status(400)
        .json({ message: "Username or email already exists." });
    }

    console.log("Register: Creating new User instance...");
    const newUser = new User({ username, email, password });
    console.log("Register: Saving new user (hashing happens pre-save)...");
    await newUser.save(); // Hashing happens here
    console.log("Register: User saved successfully.");

    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };
    console.log("Register: Sending 201 response...");
    res
      .status(201)
      .json({ message: "User registered successfully!", user: userResponse });
    console.log("Register: 201 response sent.");
  } catch (error) {
    console.error("Register: CATCH block - Error:", error);
    if (error.name === "ValidationError") {
      console.log("Register: Validation Error - Sending 400");
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    }
    console.log("Register: Generic Error - Sending 500");
    res.status(500).json({ message: "Server error during registration." });
  }
  console.log("--- POST /api/auth/register END ---");
});

// POST /login (MODIFIED Response)
authRouter.post("/login", async (req, res) => {
  console.log("\n--- POST /api/auth/login START ---");
  const { email, password } = req.body;
  console.log("Login attempt:", { email });

  if (!email || !password) {
    console.log("Login: Missing fields - Sending 400");
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    console.log("Login: Finding user by email...");
    // Select all fields except password
    const user = await User.findOne({ email }).select("-password");
    if (!user) {
      console.log("Login: User not found - Sending 401");
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Need to fetch user *with* password for comparison
    const userWithPassword = await User.findOne({ email });
    console.log("Login: User found, comparing password...");
    const isMatch = await userWithPassword.comparePassword(password);

    if (!isMatch) {
      console.log("Login: Password mismatch - Sending 401");
      return res.status(401).json({ message: "Invalid credentials." });
    }

    console.log("Login: Password matches, generating JWT...");
    // Keep payload lean, only essential info
    const payload = {
      userId: user._id,
      username: user.username,
      role: user.role, // Include role in token if needed for authorization checks
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
    console.log("Login: JWT generated.");

    console.log("Login: Sending 200 response with full user profile...");
    res.status(200).json({
      message: "Login successful!",
      token: token,
      // Return the user object *without* the password, including new fields
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
    console.log("Login: 200 response sent.");
  } catch (error) {
    console.error("Login: CATCH block - Error:", error);
    console.log("Login: Generic Error - Sending 500");
    res.status(500).json({ message: "Server error during login." });
  }
  console.log("--- POST /api/auth/login END ---");
});

app.use("/api/auth", authRouter); // Mount auth router

// --- Task Routes ---
const taskRouter = express.Router();

// POST /api/tasks - Create a new task (MODIFIED to send email)
taskRouter.post("/", authenticateToken, async (req, res) => {
  console.log(`\n--- POST /api/tasks START - User: ${req.user?.userId} ---`);
  const { title, description, dueDate, priority, status, assignee } = req.body;
  const userId = req.user.userId;
  console.log("POST /api/tasks: Received data:", req.body);

  if (!title || !dueDate || isNaN(new Date(dueDate).getTime())) {
    // Combine validation
    console.log(
      "POST /api/tasks: Validation failed (title/dueDate required, dueDate must be valid) - Sending 400"
    );
    return res
      .status(400)
      .json({ message: "Title and a valid due date are required." });
  }

  let savedTask; // Define outside try block to be accessible in finally/after

  try {
    console.log("POST /api/tasks: Creating new Task instance...");
    const newTask = new Task({
      title,
      description,
      dueDate: new Date(dueDate),
      priority: priority || "medium",
      status: status || "pending",
      assignee,
      createdBy: userId,
    });

    console.log("POST /api/tasks: Saving task...");
    savedTask = await newTask.save();
    console.log("POST /api/tasks: Task saved successfully, ID:", savedTask._id);

    // --- Send success response FIRST ---
    console.log("POST /api/tasks: Sending 201 response...");
    res
      .status(201)
      .json({ message: "Task created successfully!", task: savedTask });
    console.log("POST /api/tasks: 201 response sent.");

    // --- THEN, attempt to send email (async, non-blocking for the response) ---
    try {
      console.log("POST /api/tasks: Fetching user data for email...");
      // Fetch user only if we need to send email and have a saved task
      const taskCreator = await User.findById(userId).select("email username");
      if (taskCreator) {
        console.log("POST /api/tasks: User found, preparing to send email...");
        // Call the email function (don't await if you want it truly async)
        sendTaskCreationEmail(taskCreator, savedTask); // Fire and forget (or await if sequential processing needed)
      } else {
        console.warn(
          `POST /api/tasks: Could not find user ${userId} to send creation email.`
        );
      }
    } catch (userFetchError) {
      console.error(
        `POST /api/tasks: Error fetching user ${userId} for email:`,
        userFetchError
      );
      // Don't fail the request, just log the error
    }
  } catch (error) {
    console.error(
      "POST /api/tasks: CATCH block - Error during task save:",
      error
    );
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((el) => el.message);
      console.log("POST /api/tasks: Validation Error - Sending 400");
      // Ensure response is sent ONLY here if error occurred before res.status(201)
      if (!res.headersSent) {
        res.status(400).json({ message: "Validation Error", errors: errors });
      }
    } else {
      console.log("POST /api/tasks: Generic Error - Sending 500");
      if (!res.headersSent) {
        res.status(500).json({ message: "Server error during task creation." });
      }
    }
    // If an error occurred, do NOT attempt to send email
  } finally {
    console.log(`--- POST /api/tasks END ---`);
  }
});

// GET /api/tasks - Fetch tasks for the logged-in user
taskRouter.get("/", authenticateToken, async (req, res) => {
  console.log(`\n--- GET /api/tasks START - User: ${req.user?.userId} ---`);
  const userId = req.user.userId; // Get from middleware
  try {
    console.log("GET /api/tasks: Attempting Task.find()...");
    const tasks = await Task.find({ createdBy: userId }).sort({
      createdAt: -1,
    }); // <-- Potential Hang Point if DB issue
    console.log(`GET /api/tasks: Found ${tasks.length} tasks.`);
    console.log("GET /api/tasks: Sending 200 response...");
    res.status(200).json(tasks);
    console.log("GET /api/tasks: 200 response sent.");
  } catch (error) {
    console.error("GET /api/tasks: CATCH block - Error:", error);
    console.log("GET /api/tasks: Generic Error - Sending 500");
    res.status(500).json({ message: "Server error fetching tasks." });
  }
  console.log(`--- GET /api/tasks END ---`);
});

// --- NEW: PATCH /api/tasks/:taskId - Update task status ---
taskRouter.patch("/:taskId", authenticateToken, async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body; // Expecting { "status": "new-status" }
  const userId = req.user.userId;

  console.log(`\n--- PATCH /api/tasks/${taskId} START - User: ${userId} ---`);
  console.log("PATCH /api/tasks: Received data:", { status });

  // Validate Task ID format
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    console.log("PATCH /api/tasks: Invalid Task ID format - Sending 400");
    return res.status(400).json({ message: "Invalid task ID format" });
  }

  // Validate Status
  const allowedStatuses = ["pending", "in-progress", "completed"];
  if (!status || !allowedStatuses.includes(status)) {
    console.log("PATCH /api/tasks: Invalid status value - Sending 400");
    return res
      .status(400)
      .json({
        message: `Invalid status. Must be one of: ${allowedStatuses.join(
          ", "
        )}`,
      });
  }

  try {
    console.log(
      `PATCH /api/tasks: Finding and updating task ${taskId} for user ${userId}...`
    );
    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, createdBy: userId }, // Find task by ID AND owner
      { $set: { status: status } }, // Update only the status field
      { new: true, runValidators: true } // Return the updated doc, run schema validators
    );

    if (!updatedTask) {
      console.log(
        "PATCH /api/tasks: Task not found or user not authorized - Sending 404"
      );
      // Could be task doesn't exist OR user doesn't own it
      return res
        .status(404)
        .json({
          message: "Task not found or you do not have permission to update it.",
        });
    }

    console.log(`PATCH /api/tasks: Task ${taskId} updated successfully.`);
    console.log("PATCH /api/tasks: Sending 200 response...");
    res
      .status(200)
      .json({
        message: "Task status updated successfully!",
        task: updatedTask,
      });
    console.log("PATCH /api/tasks: 200 response sent.");
  } catch (error) {
    console.error("PATCH /api/tasks: CATCH block - Error:", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((el) => el.message);
      console.log("PATCH /api/tasks: Validation Error - Sending 400");
      return res
        .status(400)
        .json({ message: "Validation Error", errors: errors });
    }
    console.log("PATCH /api/tasks: Generic Error - Sending 500");
    res.status(500).json({ message: "Server error updating task status." });
  }
  console.log(`--- PATCH /api/tasks/${taskId} END ---`);
});

// Mount the task router under the /api/tasks path prefix
app.use("/api/tasks", taskRouter);

// --- NEW: User Profile Routes ---
const userRouter = express.Router();

// PATCH /api/user/password - Update user's password
userRouter.patch("/password", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Get from authenticated token
  const { currentPassword, newPassword } = req.body;

  console.log(`\n--- PATCH /api/user/password START - User: ${userId} ---`);
  console.log(
    "PATCH /api/user/password: Received request (passwords redacted)"
  );

  // 1. Validation
  if (!currentPassword || !newPassword) {
    console.log("PATCH /api/user/password: Missing fields - Sending 400");
    return res
      .status(400)
      .json({ message: "Current password and new password are required." });
  }
  if (newPassword.length < 6) {
    console.log(
      "PATCH /api/user/password: New password too short - Sending 400"
    );
    return res
      .status(400)
      .json({ message: "New password must be at least 6 characters long." });
  }
  if (currentPassword === newPassword) {
    console.log(
      "PATCH /api/user/password: New password same as old - Sending 400"
    );
    return res
      .status(400)
      .json({
        message: "New password cannot be the same as the current password.",
      });
  }

  try {
    // 2. Find User
    console.log(`PATCH /api/user/password: Finding user ${userId}...`);
    const user = await User.findById(userId);
    if (!user) {
      // This shouldn't happen if the token is valid, but handle defensively
      console.log(
        "PATCH /api/user/password: User not found (despite valid token?) - Sending 404"
      );
      return res.status(404).json({ message: "User not found." });
    }

    // 3. Verify Current Password
    console.log(
      `PATCH /api/user/password: Verifying current password for user ${userId}...`
    );
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      console.log(
        `PATCH /api/user/password: Current password incorrect - Sending 401`
      );
      return res.status(401).json({ message: "Incorrect current password." });
    }

    // 4. Update Password (Hashing handled by pre-save hook)
    console.log(
      `PATCH /api/user/password: Current password verified. Updating password for user ${userId}...`
    );
    user.password = newPassword; // Assign the plain text, pre-save hook will hash it
    await user.save(); // Trigger pre-save hook and save
    console.log(
      `PATCH /api/user/password: Password updated successfully for user ${userId}.`
    );

    // 5. Success Response
    console.log("PATCH /api/user/password: Sending 200 response...");
    res.status(200).json({ message: "Password updated successfully!" });
    console.log("PATCH /api/user/password: 200 response sent.");
  } catch (error) {
    console.error("PATCH /api/user/password: CATCH block - Error:", error);
    if (error.name === "ValidationError") {
      // Should be caught by initial checks, but good fallback
      const errors = Object.values(error.errors).map((el) => el.message);
      console.log(
        "PATCH /api/user/password: Validation Error during save - Sending 400"
      );
      return res
        .status(400)
        .json({ message: "Validation Error", errors: errors });
    }
    console.log("PATCH /api/user/password: Generic Error - Sending 500");
    res.status(500).json({ message: "Server error updating password." });
  }
  console.log(`--- PATCH /api/user/password END ---`);
});

// --- NEW: PATCH /api/user/profile - Update user profile details ---
userRouter.patch("/profile", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  // Only allow updating specific fields
  const { username, phone, bio, avatarUrl } = req.body;

  console.log(`\n--- PATCH /api/user/profile START - User: ${userId} ---`);
  console.log("PATCH /api/user/profile: Received data:", req.body);

  // 1. Build Update Object Dynamically
  const updateData = {};
  if (username !== undefined) updateData.username = username.trim();
  if (phone !== undefined) updateData.phone = phone.trim();
  if (bio !== undefined) updateData.bio = bio.trim();
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl.trim();

  // Check if there's anything to update
  if (Object.keys(updateData).length === 0) {
    console.log("PATCH /api/user/profile: No fields to update - Sending 400");
    return res.status(400).json({ message: "No fields provided for update." });
  }

  // 2. Basic Validation (More specific validation can be added)
  if (updateData.username && updateData.username.length < 3) {
    console.log("PATCH /api/user/profile: Username too short - Sending 400");
    return res
      .status(400)
      .json({ message: "Username must be at least 3 characters long." });
  }
  // Add validation for phone format, bio length, avatar URL format if needed

  try {
    // 3. Find User
    console.log(`PATCH /api/user/profile: Finding user ${userId}...`);
    const user = await User.findById(userId);
    if (!user) {
      console.log("PATCH /api/user/profile: User not found - Sending 404");
      return res.status(404).json({ message: "User not found." });
    }

    // 4. Check Username Uniqueness (if changed)
    if (updateData.username && updateData.username !== user.username) {
      console.log(
        `PATCH /api/user/profile: Checking username uniqueness for "${updateData.username}"...`
      );
      const existingUser = await User.findOne({
        username: updateData.username,
        _id: { $ne: userId },
      });
      if (existingUser) {
        console.log(
          "PATCH /api/user/profile: Username already exists - Sending 400"
        );
        return res.status(400).json({ message: "Username already taken." });
      }
      console.log("PATCH /api/user/profile: New username is unique.");
    }

    // 5. Apply Updates and Save
    // Object.assign(user, updateData); // Merge updateData onto the user document
    // Alternative: Update directly using findByIdAndUpdate for efficiency if not checking uniqueness first
    console.log(
      `PATCH /api/user/profile: Updating user ${userId} with:`,
      updateData
    );
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true, context: "query" } // Return updated doc, run validators
    ).select("-password"); // Exclude password from the returned object

    if (!updatedUser) {
      // Should ideally not happen if user was found before, but handle defensively
      console.log(
        "PATCH /api/user/profile: Update failed after finding user - Sending 500"
      );
      return res
        .status(500)
        .json({ message: "Failed to update user profile." });
    }

    console.log(
      `PATCH /api/user/profile: Profile updated successfully for user ${userId}.`
    );

    // 6. Success Response with Updated User Data
    console.log("PATCH /api/user/profile: Sending 200 response...");
    res.status(200).json({
      message: "Profile updated successfully!",
      user: updatedUser, // Send back the updated user data (without password)
    });
    console.log("PATCH /api/user/profile: 200 response sent.");
  } catch (error) {
    console.error("PATCH /api/user/profile: CATCH block - Error:", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((el) => el.message);
      console.log("PATCH /api/user/profile: Validation Error - Sending 400");
      return res
        .status(400)
        .json({ message: "Validation Error", errors: errors });
    }
    if (error.code === 11000) {
      // Duplicate key error (likely username or email if unique index exists)
      console.log("PATCH /api/user/profile: Duplicate key error - Sending 400");
      return res
        .status(400)
        .json({ message: "Username or email already exists." });
    }
    console.log("PATCH /api/user/profile: Generic Error - Sending 500");
    res.status(500).json({ message: "Server error updating profile." });
  }
  console.log(`--- PATCH /api/user/profile END ---`);
});

// --- NEW: Mount the user router ---
app.use("/api/user", userRouter);

// --- NEW: Team Routes ---
const teamRouter = express.Router();

// GET /api/team/members - Fetch all users (team members)
teamRouter.get("/members", authenticateToken, async (req, res) => {
  console.log(
    `\n--- GET /api/team/members START - User: ${req.user?.userId} ---`
  );
  // Future enhancement: Add logic here based on req.user.role or team ID if implementing multi-tenancy/teams

  try {
    // Fetch all users, excluding their passwords
    // Optionally add sorting, e.g., by username: .sort({ username: 1 })
    const members = await User.find({})
      .select("-password")
      .sort({ username: 1 });
    console.log(`GET /api/team/members: Found ${members.length} members.`);

    // TODO: Calculate assigned tasks count for each member if needed (more complex query/aggregation)
    // For now, we'll return users without the task count. Frontend will adapt.

    console.log("GET /api/team/members: Sending 200 response...");
    res.status(200).json(members);
    console.log("GET /api/team/members: 200 response sent.");
  } catch (error) {
    console.error("GET /api/team/members: CATCH block - Error:", error);
    console.log("GET /api/team/members: Generic Error - Sending 500");
    res.status(500).json({ message: "Server error fetching team members." });
  }
  console.log(`--- GET /api/team/members END ---`);
});

// POST /api/team/members - Add a new team member (essentially register a user)
teamRouter.post("/members", authenticateToken, async (req, res) => {
  // Future enhancement: Check if req.user has permission (e.g., admin role) to add members
  console.log(
    `\n--- POST /api/team/members START - User: ${req.user?.userId} ---`
  );
  const { username, email, password, role } = req.body; // Role might be optional
  console.log("POST /api/team/members: Received data:", {
    username,
    email,
    role,
  }); // Don't log password

  // --- Validation ---
  if (!username || !email || !password) {
    console.log("POST /api/team/members: Missing fields - Sending 400");
    return res
      .status(400)
      .json({ message: "Username, email, and password are required." });
  }
  if (password.length < 6) {
    console.log("POST /api/team/members: Password too short - Sending 400");
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long." });
  }
  const validRoles = ["user", "admin"]; // Roles defined in your schema
  if (role && !validRoles.includes(role)) {
    console.log("POST /api/team/members: Invalid role specified - Sending 400");
    return res
      .status(400)
      .json({
        message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
  }
  // Add more validation if needed (e.g., email format regex check server-side too)

  try {
    // --- Check for existing user ---
    console.log("POST /api/team/members: Checking existing user...");
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log("POST /api/team/members: User exists - Sending 400");
      const field = existingUser.email === email ? "Email" : "Username";
      return res.status(400).json({ message: `${field} already exists.` });
    }

    // --- Create and save new user ---
    console.log("POST /api/team/members: Creating new User instance...");
    // Use provided role or default from schema ('user')
    const newUser = new User({
      username,
      email,
      password,
      role: role || undefined,
    }); // Let schema default handle if role is null/undefined
    console.log(
      "POST /api/team/members: Saving new user (hashing happens pre-save)..."
    );
    const savedUser = await newUser.save();
    console.log("POST /api/team/members: User saved successfully.");

    // --- Prepare response (exclude password) ---
    const userResponse = {
      _id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      role: savedUser.role,
      phone: savedUser.phone,
      bio: savedUser.bio,
      avatarUrl: savedUser.avatarUrl,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };

    console.log("POST /api/team/members: Sending 201 response...");
    res
      .status(201)
      .json({ message: "Team member added successfully!", user: userResponse });
    console.log("POST /api/team/members: 201 response sent.");

    // TODO: Optionally send a welcome email to the new team member
  } catch (error) {
    console.error("POST /api/team/members: CATCH block - Error:", error);
    if (error.name === "ValidationError") {
      console.log("POST /api/team/members: Validation Error - Sending 400");
      const errors = Object.values(error.errors).map((el) => el.message);
      return res
        .status(400)
        .json({ message: "Validation Error", errors: errors });
    }
    // Handle potential duplicate key errors during save just in case findOne misses a race condition
    if (error.code === 11000) {
      console.log(
        "POST /api/team/members: Duplicate key error on save - Sending 400"
      );
      return res
        .status(400)
        .json({ message: "Username or email already exists." });
    }
    console.log("POST /api/team/members: Generic Error - Sending 500");
    res.status(500).json({ message: "Server error adding team member." });
  }
  console.log("--- POST /api/team/members END ---");
});

// --- NEW: Mount the team router ---
app.use("/api/team", teamRouter);

// --- Simple Error Handling Middleware (Keep at the end) ---
app.use((err, req, res, next) => {
  console.error("--- FINAL ERROR HANDLER ---");
  console.error("Unhandled Error Status:", err.status);
  console.error("Unhandled Error Message:", err.message);
  console.error("Unhandled Error Stack:", err.stack || "No stack available");
  // Avoid sending stack in production
  const responseError = {
    message: err.message || "Something went wrong on the server!",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };
  // Ensure a status code is set, default to 500
  const statusCode = err.status || 500;
  res.status(statusCode).json(responseError);
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`\nServer listening on http://localhost:${PORT}`);
  console.log(`MongoDB URI: ${MONGODB_URI ? "Set" : "NOT SET!"}`);
  console.log(`JWT Secret: ${JWT_SECRET ? "Set" : "NOT SET!"}`);
  console.log("Backend Ready.");
});
