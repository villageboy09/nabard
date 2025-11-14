// Vercel Serverless Function Handler with Mock Data Support
import jwt from 'jsonwebtoken';

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) throw new Error('Access token required');

  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.verify(token, secret);
}

// Mock alerts data
function getMockAlerts(userId, filters = {}) {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const allAlerts = [
    {
      id: 'alert-1',
      farmerProfileId: 'profile-1',
      fieldId: 'field-1',
      alertType: 'PEST',
      severity: 'HIGH',
      title: 'Pest Alert: Bollworm Activity Detected',
      message: 'High bollworm activity detected in nearby fields. Immediate monitoring and organic pest control measures recommended for your cotton crop.',
      createdAt: yesterday.toISOString(),
      readAt: null,
      deliveryChannels: ['APP', 'SMS'],
    },
    {
      id: 'alert-2',
      farmerProfileId: 'profile-1',
      fieldId: 'field-1',
      alertType: 'WEATHER',
      severity: 'MEDIUM',
      title: 'Weather Alert: High Temperature Forecast',
      message: 'Temperature expected to exceed 38°C for the next 3 days. Ensure adequate irrigation for your cotton crop to prevent heat stress.',
      createdAt: yesterday.toISOString(),
      readAt: null,
      deliveryChannels: ['APP', 'WHATSAPP'],
    },
    {
      id: 'alert-3',
      farmerProfileId: 'profile-1',
      fieldId: 'field-2',
      alertType: 'MARKET',
      severity: 'LOW',
      title: 'Market Update: Soybean Prices Increasing',
      message: 'Soybean prices have increased by 8% this week to ₹4,650/quintal. Consider locking in prices with forward contracts.',
      createdAt: twoDaysAgo.toISOString(),
      readAt: twoDaysAgo.toISOString(),
      deliveryChannels: ['APP'],
    },
    {
      id: 'alert-4',
      farmerProfileId: 'profile-1',
      fieldId: 'field-3',
      alertType: 'DISEASE',
      severity: 'MEDIUM',
      title: 'Disease Alert: Brown Spot Risk',
      message: 'Weather conditions favorable for brown spot disease in rice. Apply recommended fungicide as preventive measure.',
      createdAt: threeDaysAgo.toISOString(),
      readAt: null,
      deliveryChannels: ['APP', 'SMS'],
    },
    {
      id: 'alert-5',
      farmerProfileId: 'profile-1',
      fieldId: 'field-1',
      alertType: 'IRRIGATION',
      severity: 'HIGH',
      title: 'Irrigation Alert: Soil Moisture Low',
      message: 'Soil moisture in cotton field has dropped to 42%. Irrigation required within 24 hours to prevent crop stress.',
      createdAt: now.toISOString(),
      readAt: null,
      deliveryChannels: ['APP', 'SMS', 'WHATSAPP'],
    },
  ];

  // Apply filters
  let filteredAlerts = allAlerts;

  if (filters.status === 'unread') {
    filteredAlerts = filteredAlerts.filter(a => !a.readAt);
  }

  if (filters.severity) {
    filteredAlerts = filteredAlerts.filter(a => a.severity === filters.severity);
  }

  if (filters.type) {
    filteredAlerts = filteredAlerts.filter(a => a.alertType === filters.type);
  }

  const limit = parseInt(filters.limit) || 50;
  const alerts = filteredAlerts.slice(0, limit);
  const unreadCount = allAlerts.filter(a => !a.readAt).length;

  return { alerts, unreadCount };
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

    const { status, severity, type, limit = 50 } = req.query;
    let alertsData = null;
    let useMockData = false;

    try {
      // Try database first
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { farmerProfile: true },
      });

      if (user?.farmerProfile) {
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

        alertsData = { alerts, unreadCount };
      }

      await prisma.$disconnect();
    } catch (dbError) {
      console.log('Database not available, using mock data:', dbError.message);
      useMockData = true;
    }

    // Fallback to mock data
    if (!alertsData || useMockData) {
      alertsData = getMockAlerts(userId, { status, severity, type, limit });
    }

    res.status(200).json({
      status: 'success',
      data: alertsData,
    });
  } catch (error) {
    console.error('Alerts error:', error);
    if (error.message === 'Access token required' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    res.status(500).json({ status: 'error', message: 'Internal server error: ' + error.message });
  }
}
