import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@tradeinsight/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (user: Pick<User, 'id' | 'email' | 'role'>): string => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};