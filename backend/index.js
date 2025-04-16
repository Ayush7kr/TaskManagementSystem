// index.js
const app = require('./app'); // Import the configured Express app
const config = require('./config'); // Import config to get PORT

// Start the server
const server = app.listen(config.PORT, () => {
  console.log(`\nServer listening on http://localhost:${config.PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
  // Initial config checks are now done within the modules (db.js, config/index.js)
  // Email transporter readiness is logged within config/email.js
  console.log("Backend Ready.");
});

// Optional: Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        // Close database connection if needed
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
         mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});