// Vercel Serverless Function Handler with Mock Data Support
import jwt from 'jsonwebtoken';

// Mock users for demo mode (works without database)
const MOCK_USERS = [
  {
    id: 'mock-farmer-1',
    email: 'farmer1@demo.com',
    password: 'demo123',
    name: 'Rajesh Kumar',
    role: 'FARMER',
    farmerProfile: {
      id: 'profile-1',
      phoneNumber: '+91-9876543210',
      totalLandArea: 5.5,
      registrationNumber: 'AGR2024001',
      languagePreference: 'en',
    },
  },
  {
    id: 'mock-farmer-2',
    email: 'farmer2@demo.com',
    password: 'demo123',
    name: 'Priya Sharma',
    role: 'FARMER',
    farmerProfile: {
      id: 'profile-2',
      phoneNumber: '+91-9876543211',
      totalLandArea: 3.2,
      registrationNumber: 'AGR2024002',
      languagePreference: 'en',
    },
  },
  {
    id: 'mock-lender-1',
    email: 'lender@demo.com',
    password: 'demo123',
    name: 'Bank of Agriculture',
    role: 'LENDER',
    lenderProfile: {
      id: 'lender-profile-1',
      institutionName: 'National Agriculture Bank',
      institutionType: 'BANK',
      licenseNumber: 'NBF2024001',
    },
  },
];

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    // Try database first (if available)
    let user = null;
    let useMockData = false;

    try {
      // Dynamically import Prisma only if needed
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      user = await prisma.user.findUnique({
        where: { email },
        include: {
          farmerProfile: true,
          lenderProfile: true,
        },
      });

      await prisma.$disconnect();

      // Verify password for database user
      if (user) {
        const bcrypt = await import('bcryptjs');
        const isDemoMode = process.env.DEMO_MODE === 'true';
        const isValidPassword = isDemoMode && password === 'demo123'
          ? true
          : await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return res.status(401).json({
            status: 'error',
            message: 'Invalid credentials'
          });
        }
      }
    } catch (dbError) {
      console.log('Database not available, using mock data:', dbError.message);
      useMockData = true;
    }

    // Fallback to mock data if database is not available or user not found
    if (!user || useMockData) {
      user = MOCK_USERS.find(u => u.email === email);

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }

      if (user.password !== password) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }
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

    res.status(200).json({
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
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error: ' + error.message
    });
  }
}
