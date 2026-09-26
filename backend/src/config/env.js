import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cleantrack',
  JWT_SECRET: process.env.JWT_SECRET || 'cleantrack_jwt_super_secret_key_2026_smart_city_secure',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000/api/ai',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  SLA_TEST_MODE: process.env.SLA_TEST_MODE === 'true' || true,
  NODE_ENV: process.env.NODE_ENV || 'development'
};
