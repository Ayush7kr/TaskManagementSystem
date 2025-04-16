// services/email.service.js
const getTransporter = require('../config/email');
const { getTestMessageUrl } = require('../config/email'); // Import helper
const config = require('../config');
const { format } = require("date-fns");
const User = require('../models/User'); // User model needed to fetch email recipient details

/**
 * Sends a task creation notification email.
 * @param {object} user - The user object (must contain email, optionally username).
 * @param {object} task - The task object.
 */
async function sendTaskCreationEmail(user, task) {
  const transporter = getTransporter(); // Get the initialized transporter instance

  if (!transporter || typeof transporter.sendMail !== 'function') {
    console.error("Email transporter is not properly initialized. Cannot send email.");
    return;
  }
  if (!user || !user.email) {
    console.error("Cannot send task creation email: User email is missing.");
    return;
  }

  const mailOptions = {
    from: config.EMAIL_FROM,
    to: user.email,
    subject: `✅ New Task Created: ${task.title}`,
    text: `Hello ${user.username || "User"},\n\nA new task has been created for you:\n\nTitle: ${task.title}\nDescription: ${task.description || "N/A"}\nDue Date: ${format(task.dueDate, "PPpp")}\nPriority: ${task.priority}\nStatus: ${task.status}\nAssignee: ${task.assignee || "N/A"}\n\nYou can view your tasks in the Task Master application.\n\nRegards,\nThe Task Master Team`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.6;">
          <h2>Hello ${user.username || "User"},</h2>
          <p>A new task titled "<strong>${task.title}</strong>" has been successfully created for you in the Task Master application.</p>
          <h3>Task Details:</h3>
          <ul>
              <li><strong>Title:</strong> ${task.title}</li>
              <li><strong>Description:</strong> ${task.description || "N/A"}</li>
              <li><strong>Due Date:</strong> ${format(task.dueDate, "MMMM d, yyyy 'at' h:mm a")}</li>
              <li><strong>Priority:</strong> <span style="text-transform: capitalize;">${task.priority}</span></li>
              <li><strong>Status:</strong> <span style="text-transform: capitalize;">${task.status.replace("-", " ")}</span></li>
              <li><strong>Assignee:</strong> ${task.assignee || "N/A"}</li>
          </ul>
          <p>You can view and manage your tasks by logging into the application.</p>
          <hr>
          <p style="font-size: 0.9em; color: #666;">This is an automated notification. Please do not reply directly to this email.</p>
      </div>
    `,
  };

  try {
    console.log(`Attempting to send task creation email to ${user.email}...`);
    let info = await transporter.sendMail(mailOptions);
    console.log("Task creation email sent: %s", info.messageId);

    // Log preview URL if using Ethereal
    const previewUrl = getTestMessageUrl(info);
    if (previewUrl) {
        console.log("Preview URL: %s", previewUrl);
    }

  } catch (error) {
    console.error(`Error sending task creation email to ${user.email}:`, error);
    // Do not re-throw, let the API request succeed even if email fails.
  }
}

module.exports = {
  sendTaskCreationEmail,
  // Add other email sending functions here if needed
};