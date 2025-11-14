import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { ValidationError, UnauthorizedError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class AuthController {
  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      // For demo mode, allow simple login
      const isDemoMode = process.env.DEMO_MODE === 'true';

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          farmerProfile: true,
          lenderProfile: true,
        },
      });

      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Verify password
      let isValidPassword = false;
      if (isDemoMode && password === 'demo123') {
        isValidPassword = true;
        logger.info(`Demo mode login for ${email}`);
      } else {
        isValidPassword = await bcrypt.compare(password, user.password);
      }

      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Generate JWT token
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        secret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        status: 'success',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            farmerProfile: user.farmerProfile,
            lenderProfile: user.lenderProfile,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register new user (demo only)
   * POST /api/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, role = 'FARMER' } = req.body;

      if (!email || !password || !name) {
        throw new ValidationError('Email, password, and name are required');
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ValidationError('User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role as 'FARMER' | 'LENDER' | 'ADMIN',
        },
      });

      // Generate token
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        secret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        status: 'success',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  async me(req: any, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          farmerProfile: {
            include: {
              fields: true,
            },
          },
          lenderProfile: true,
        },
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      res.json({
        status: 'success',
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          farmerProfile: user.farmerProfile,
          lenderProfile: user.lenderProfile,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
