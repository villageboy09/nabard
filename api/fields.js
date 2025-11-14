// Vercel Serverless Function Handler with Mock Data Support
import jwt from 'jsonwebtoken';

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) throw new Error('Access token required');

  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.verify(token, secret);
}

// Mock fields data
function getMockFields(userId) {
  return [
    {
      id: 'field-1',
      fieldCode: 'FIELD-001',
      farmerProfileId: 'profile-1',
      area: 2.5,
      latitude: 18.5204,
      longitude: 73.8567,
      soilType: 'BLACK_SOIL',
      currentCrop: 'Cotton',
      cropStage: 'VEGETATIVE',
      sowingDate: new Date('2024-06-15').toISOString(),
      expectedHarvestDate: new Date('2024-12-15').toISOString(),
      irrigationType: 'DRIP',
      hasWeatherStation: false,
      createdAt: new Date('2024-06-01').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'field-2',
      fieldCode: 'FIELD-002',
      farmerProfileId: 'profile-1',
      area: 1.8,
      latitude: 18.5304,
      longitude: 73.8667,
      soilType: 'RED_SOIL',
      currentCrop: 'Soybean',
      cropStage: 'FLOWERING',
      sowingDate: new Date('2024-07-01').toISOString(),
      expectedHarvestDate: new Date('2024-11-30').toISOString(),
      irrigationType: 'SPRINKLER',
      hasWeatherStation: true,
      createdAt: new Date('2024-06-01').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'field-3',
      fieldCode: 'FIELD-003',
      farmerProfileId: 'profile-1',
      area: 1.2,
      latitude: 18.5104,
      longitude: 73.8467,
      soilType: 'ALLUVIAL',
      currentCrop: 'Rice',
      cropStage: 'TILLERING',
      sowingDate: new Date('2024-07-15').toISOString(),
      expectedHarvestDate: new Date('2024-12-30').toISOString(),
      irrigationType: 'FLOOD',
      hasWeatherStation: false,
      createdAt: new Date('2024-06-01').toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
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

    let fields = null;
    let useMockData = false;

    try {
      // Try database first
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          farmerProfile: {
            include: {
              fields: true,
            },
          },
        },
      });

      if (user?.farmerProfile) {
        fields = user.farmerProfile.fields;
      }

      await prisma.$disconnect();
    } catch (dbError) {
      console.log('Database not available, using mock data:', dbError.message);
      useMockData = true;
    }

    // Fallback to mock data
    if (!fields || useMockData) {
      fields = getMockFields(userId);
    }

    res.status(200).json({
      status: 'success',
      data: fields,
    });
  } catch (error) {
    console.error('Fields error:', error);
    if (error.message === 'Access token required' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    res.status(500).json({ status: 'error', message: 'Internal server error: ' + error.message });
  }
}
