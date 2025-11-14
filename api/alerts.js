import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) throw new Error('Access token required');

  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.verify(token, secret);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    const decoded = verifyToken(req);
    const userId = decoded.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { farmerProfile: true },
    });

    if (!user?.farmerProfile) {
      return res.status(400).json({ status: 'error', message: 'Farmer profile not found' });
    }

    const { status, severity, type, limit = 50 } = req.query;

    const where = {
      farmerProfileId: user.farmerProfile.id,
    };

    if (status === 'unread') {
      where.readAt = null;
    }

    if (severity) {
      where.severity = severity;
    }

    if (type) {
      where.alertType = type;
    }

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    const unreadCount = await prisma.alert.count({
      where: {
        farmerProfileId: user.farmerProfile.id,
        readAt: null,
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        alerts,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Alerts error:', error);
    if (error.message === 'Access token required' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
