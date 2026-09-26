import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[CleanTrack DB] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[CleanTrack DB Error] Failed to connect to MongoDB at ${env.MONGODB_URI}:`, error.message);
    console.error(`[CleanTrack DB] Make sure MongoDB is running locally (e.g. mongod) or provide a valid MongoDB Atlas connection string in backend/.env`);
    // Return null without crashing immediately so API can provide meaningful diagnostic error
    return null;
  }
};
