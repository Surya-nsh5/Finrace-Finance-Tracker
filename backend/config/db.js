const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return;
    }

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not defined');
    }
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 5, // Lower max connections for serverless environments
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000, 
      socketTimeoutMS: 45000, 
      maxIdleTimeMS: 30000 // Close idle connections
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Only exit process if not in serverless environment (e.g. local dev)
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    } else {
      throw error; // Let serverless function handle/log it
    }
  }
};

module.exports = connectDB;