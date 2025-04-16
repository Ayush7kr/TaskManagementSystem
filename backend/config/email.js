// config/email.js
const nodemailer = require("nodemailer");
const config = require("./index"); // Import all config vars

let transporter;

const useRealEmailService = config.EMAIL_HOST || config.EMAIL_SERVICE;

const initializeTransporter = async () => {
  if (config.NODE_ENV === "development" && !useRealEmailService) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log("Ethereal test account credentials obtained");
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log("Nodemailer configured with Ethereal for testing.");
      // Log base URL for previewing - actual URL comes after sending
      console.log("Preview emails at Ethereal (URL will appear after first email sent)");
    } catch (err) {
      console.error("Failed to create a testing account. " + err.message);
      process.exit(1);
    }
  } else if (useRealEmailService) {
    let transportOptions;
    if (config.EMAIL_SERVICE && config.EMAIL_SERVICE.toLowerCase() === "gmail") {
      transportOptions = {
        service: "gmail",
        auth: {
          user: config.EMAIL_USER,
          pass: config.EMAIL_PASS, // Use App Password for Gmail
        },
      };
      console.log("Nodemailer configured with Gmail service.");
    } else {
      transportOptions = {
        host: config.EMAIL_HOST,
        port: parseInt(config.EMAIL_PORT || "587", 10),
        secure: config.EMAIL_SECURE, // true for 465, false for others
        auth: {
          user: config.EMAIL_USER,
          pass: config.EMAIL_PASS,
        },
      };
      console.log(`Nodemailer configured with SMTP host: ${config.EMAIL_HOST}`);
    }
    transporter = nodemailer.createTransport(transportOptions);

    try {
      await transporter.verify();
      console.log("Nodemailer is ready to send real emails.");
    } catch (error) {
      console.error("Nodemailer configuration error:", error);
      // Decide if you want to exit or just warn
      // process.exit(1);
    }
  } else {
    console.warn("WARN: Email service is not configured. Emails will not be sent.");
    // Create a dummy transporter
    transporter = {
      sendMail: (options, callback) => {
        console.log("Dummy transporter: Email sending skipped (service not configured). To:", options.to, "Subject:", options.subject);
        const info = { messageId: "dummy-" + Date.now() };
        if (callback) callback(null, info);
        return Promise.resolve(info);
      },
      verify: (callback) => {
        console.log("Dummy transporter: Verification skipped.");
        if(callback) callback(null, true);
        return Promise.resolve(true);
      },
      // Add getTestMessageUrl property for consistency, although it won't be used
      getTestMessageUrl: (info) => null,
    };
  }
};

// Initialize transporter when this module is loaded
initializeTransporter();

module.exports = () => {
    if (!transporter) {
        console.warn("WARN: Transporter accessed before initialization. Retrying initialization.");
        // This might happen in very rare race conditions, though unlikely with top-level await/async setup.
        // Or if initializeTransporter failed silently earlier.
        initializeTransporter(); // Attempt re-initialization (might still fail)
        if (!transporter) {
            throw new Error("Email transporter could not be initialized.");
        }
    }
    return transporter;
};

// Function to get test message URL safely
module.exports.getTestMessageUrl = (info) => {
    if (config.NODE_ENV === 'development' && !useRealEmailService && transporter && typeof nodemailer.getTestMessageUrl === 'function') {
        return nodemailer.getTestMessageUrl(info);
    }
    return null; // Return null if not applicable
};