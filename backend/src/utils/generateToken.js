import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};
