// controllers/task.controller.js
const Task = require('../models/Task');
const User = require('../models/User'); // Needed for email sending
const { sendTaskCreationEmail } = require('../services/email.service');
const mongoose = require('mongoose'); // For ObjectId validation

// Create a new task
exports.createTask = async (req, res) => {
  const userId = req.user.userId; // From authenticateToken middleware
  console.log(`\n--- POST /api/tasks START - User: ${userId} ---`);
  const { title, description, dueDate, priority, status, assignee } = req.body;
  console.log("POST /api/tasks: Received data:", req.body);

  // Validation
  if (!title || !dueDate) {
    console.log("POST /api/tasks: Missing title or dueDate - Sending 400");
    return res.status(400).json({ message: "Title and due date are required." });
  }
  if (isNaN(new Date(dueDate).getTime())) {
      console.log("POST /api/tasks: Invalid dueDate format - Sending 400");
      return res.status(400).json({ message: "Invalid due date format provided." });
  }

  let savedTask; // Declare here to be accessible in the email sending part

  try {
    console.log("POST /api/tasks: Creating new Task instance...");
    const newTask = new Task({
      title,
      description,
      dueDate: new Date(dueDate),
      priority: priority || "medium", // Use default if not provided
      status: status || "pending",   // Use default if not provided
      assignee,
      createdBy: userId,
    });

    console.log("POST /api/tasks: Saving task...");
    savedTask = await newTask.save();
    console.log("POST /api/tasks: Task saved successfully, ID:", savedTask._id);

    // --- Send success response FIRST ---
    console.log("POST /api/tasks: Sending 201 response...");
    res.status(201).json({ message: "Task created successfully!", task: savedTask });
    console.log("POST /api/tasks: 201 response sent.");

    // --- THEN, attempt to send email (async, non-blocking for the response) ---
    // Use try-catch specifically for the email part to avoid failing the main request
    try {
        console.log("POST /api/tasks: Fetching user data for email...");
        // Fetch user details needed for the email (like email address and username)
        const taskCreator = await User.findById(userId).select("email username").lean(); // Use lean for performance if only reading
        if (taskCreator) {
            console.log("POST /api/tasks: User found, preparing to send email...");
            // Don't await this if you want the response to return immediately
            sendTaskCreationEmail(taskCreator, savedTask);
        } else {
            console.warn(`POST /api/tasks: Could not find user ${userId} to send creation email.`);
        }
    } catch (emailError) {
        console.error(`POST /api/tasks: Error during email preparation/sending for task ${savedTask._id}:`, emailError);
        // Log the error but don't affect the HTTP response already sent
    }

  } catch (error) {
    console.error("POST /api/tasks: CATCH block - Error during task save:", error);
    // Check if response has already been sent before trying to send an error response
    if (!res.headersSent) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(el => el.message);
            console.log("POST /api/tasks: Validation Error - Sending 400");
            res.status(400).json({ message: "Validation Error", errors: errors });
        } else {
            console.log("POST /api/tasks: Generic Error - Sending 500");
            res.status(500).json({ message: "Server error during task creation." });
        }
    } else {
        console.error("POST /api/tasks: Error occurred after response was sent:", error.message);
    }
  } finally {
      console.log(`--- POST /api/tasks END ---`);
  }
};

// Get all tasks for the logged-in user
exports.getTasks = async (req, res) => {
  const userId = req.user.userId; // From authenticateToken middleware
  console.log(`\n--- GET /api/tasks START - User: ${userId} ---`);

  try {
    console.log(`GET /api/tasks: Finding tasks for user ${userId}...`);
    // Find tasks created by the user, sort by creation date descending
    const tasks = await Task.find({ createdBy: userId }).sort({ createdAt: -1 });
    console.log(`GET /api/tasks: Found ${tasks.length} tasks.`);

    console.log("GET /api/tasks: Sending 200 response...");
    res.status(200).json(tasks);
    console.log("GET /api/tasks: 200 response sent.");

  } catch (error) {
    console.error("GET /api/tasks: CATCH block - Error:", error);
    console.log("GET /api/tasks: Generic Error - Sending 500");
    res.status(500).json({ message: "Server error fetching tasks." });
  } finally {
      console.log(`--- GET /api/tasks END ---`);
  }
};

// Update task status (or potentially other fields later)
exports.updateTask = async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.userId; // From authenticateToken middleware
  const updateData = req.body; // Contains fields to update (e.g., { status: 'completed' })

  console.log(`\n--- PATCH /api/tasks/${taskId} START - User: ${userId} ---`);
  console.log("PATCH /api/tasks: Received data:", updateData);

  // Validate Task ID format
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    console.log("PATCH /api/tasks: Invalid Task ID format - Sending 400");
    return res.status(400).json({ message: "Invalid task ID format" });
  }

  // Optional: Validate specific fields being updated (e.g., status enum)
  if (updateData.status) {
      const allowedStatuses = Task.schema.path('status').enumValues; // Get from schema
      if (!allowedStatuses.includes(updateData.status)) {
          console.log("PATCH /api/tasks: Invalid status value - Sending 400");
          return res.status(400).json({
              message: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}`
          });
      }
  }
  // Add more validation for other fields if needed

  try {
    console.log(`PATCH /api/tasks: Finding and updating task ${taskId} for user ${userId}...`);
    // Find task by ID and ensure it belongs to the requesting user
    // Use $set to apply updates from updateData object
    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, createdBy: userId },
      { $set: updateData },
      { new: true, runValidators: true } // Return the updated doc, run schema validators
    );

    if (!updatedTask) {
      console.log("PATCH /api/tasks: Task not found or user not authorized - Sending 404");
      // Could be task doesn't exist OR user doesn't own it
      return res.status(404).json({ message: "Task not found or you do not have permission to update it." });
    }

    console.log(`PATCH /api/tasks: Task ${taskId} updated successfully.`);
    console.log("PATCH /api/tasks: Sending 200 response...");
    res.status(200).json({ message: "Task updated successfully!", task: updatedTask });
    console.log("PATCH /api/tasks: 200 response sent.");

  } catch (error) {
    console.error("PATCH /api/tasks: CATCH block - Error:", error);
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(el => el.message);
        console.log("PATCH /api/tasks: Validation Error - Sending 400");
        return res.status(400).json({ message: "Validation Error", errors: errors });
    }
    console.log("PATCH /api/tasks: Generic Error - Sending 500");
    res.status(500).json({ message: "Server error updating task." });
  } finally {
      console.log(`--- PATCH /api/tasks/${taskId} END ---`);
  }
};

// Delete a task (Optional - Add if needed)
exports.deleteTask = async (req, res) => {
    const { taskId } = req.params;
    const userId = req.user.userId;

    console.log(`\n--- DELETE /api/tasks/${taskId} START - User: ${userId} ---`);

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        console.log("DELETE /api/tasks: Invalid Task ID format - Sending 400");
        return res.status(400).json({ message: "Invalid task ID format" });
    }

    try {
        console.log(`DELETE /api/tasks: Finding and deleting task ${taskId} for user ${userId}...`);
        const result = await Task.findOneAndDelete({ _id: taskId, createdBy: userId });

        if (!result) {
            console.log("DELETE /api/tasks: Task not found or user not authorized - Sending 404");
            return res.status(404).json({ message: "Task not found or you do not have permission to delete it." });
        }

        console.log(`DELETE /api/tasks: Task ${taskId} deleted successfully.`);
        console.log("DELETE /api/tasks: Sending 200 response...");
        res.status(200).json({ message: "Task deleted successfully!", taskId: taskId }); // Send back ID for frontend update
        console.log("DELETE /api/tasks: 200 response sent.");

    } catch (error) {
        console.error("DELETE /api/tasks: CATCH block - Error:", error);
        console.log("DELETE /api/tasks: Generic Error - Sending 500");
        res.status(500).json({ message: "Server error deleting task." });
    } finally {
        console.log(`--- DELETE /api/tasks/${taskId} END ---`);
    }
};