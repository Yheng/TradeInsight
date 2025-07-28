import express from 'express';
import { body, validationResult } from 'express-validator';
const { v4: uuidv4 } = require('uuid');
import { hashPassword, comparePassword, generateToken, validateEmail, validatePassword } from '@tradeinsight/utils';
import { User, UserRole } from '@tradeinsight/types';
import { DatabaseService } from '../database/DatabaseService';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 30 }).trim(),
  body('password').isLength({ min: 8 }),
  body('firstName').isLength({ min: 1, max: 50 }).trim(),
  body('lastName').isLength({ min: 1, max: 50 }).trim()
], asyncHandler(async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { email, username, password, firstName, lastName } = req.body;

  // Additional password validation
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Password validation failed',
      details: passwordValidation.errors
    });
  }

  // Check if user already exists
  const existingUser = await DatabaseService.get(
    'SELECT id FROM users WHERE email = ? OR username = ?',
    [email, username]
  );

  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: 'User with this email or username already exists'
    });
  }

  // Create new user
  const userId = uuidv4();
  const hashedPassword = await hashPassword(password);

  await DatabaseService.run(
    `INSERT INTO users (id, email, username, password_hash, first_name, last_name, role)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, email, username, hashedPassword, firstName, lastName, UserRole.USER]
  );

  const user: Partial<User> = {
    id: userId,
    email,
    username,
    firstName,
    lastName,
    role: UserRole.USER,
    isEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const token = generateToken({
    id: userId,
    email,
    role: UserRole.USER
  });

  res.status(201).json({
    success: true,
    data: {
      user,
      token
    }
  });
}));

// Login
router.post('/login', [
  body('emailOrUsername').notEmpty(),
  body('password').notEmpty()
], asyncHandler(async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Email/username and password are required'
    });
  }

  const { emailOrUsername, password } = req.body;

  // Find user by email or username
  const user = await DatabaseService.get<any>(
    'SELECT * FROM users WHERE email = ? OR username = ?',
    [emailOrUsername, emailOrUsername]
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  });

  // Format user data to match frontend expectations
  const formattedUser: Partial<User> = {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    isEmailVerified: Boolean(user.is_email_verified),
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at)
  };

  res.json({
    success: true,
    data: {
      user: formattedUser,
      token
    }
  });
}));

// Get current user
router.get('/me', asyncHandler(async (req: any, res: any) => {
  // This route would need auth middleware in a real implementation
  res.json({
    success: true,
    message: 'Authentication endpoint - implement with auth middleware'
  });
}));

export default router;