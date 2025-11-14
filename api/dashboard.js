// Vercel Serverless Function Handler with Mock Data Support
import jwt from 'jsonwebtoken';

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new Error('Access token required');
  }

  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.verify(token, secret);
}

// Mock data for demo mode
function getMockDashboardData(userId) {
  const today = new Date();

  const mockFields = [
    {
      id: 'field-1',
      fieldCode: 'FIELD-001',
      area: 2.5,
      latitude: 18.5204,
      longitude: 73.8567,
      currentCrop: 'Cotton',
      cropStage: 'VEGETATIVE',
      currentRisk: {
        id: 'risk-1',
        overallRisk: 58,
        riskLevel: 'HIGH',
        weatherRisk: 62,
        ndviRisk: 45,
        soilRisk: 35,
        pestRisk: 70,
        marketRisk: 40,
        yieldImpact: 15,
        repaymentRisk: 25,
        confidence: 85,
        calculationDate: today.toISOString(),
        geminiSummary: 'Cotton crop showing elevated risk due to pest pressure and weather conditions. Rainfall deficit in the past week has increased stress levels. NDVI indicates moderate vegetation health.',
        geminiRecommendations: JSON.stringify([
          'Monitor for bollworm activity and consider organic pest control measures',
          'Ensure adequate irrigation to compensate for rainfall deficit',
          'Apply foliar nutrients to improve plant vigor',
        ]),
        geminiRiskBreakdown: JSON.stringify({
          weather: 'High risk due to 40% rainfall deficit and temperatures above 35°C',
          pest: 'Critical - Bollworm infestation detected in nearby fields',
          soil: 'Moderate - Soil moisture at 45%, needs irrigation',
          market: 'Stable - Cotton prices holding steady at ₹6,500/quintal',
        }),
      },
    },
    {
      id: 'field-2',
      fieldCode: 'FIELD-002',
      area: 1.8,
      latitude: 18.5304,
      longitude: 73.8667,
      currentCrop: 'Soybean',
      cropStage: 'FLOWERING',
      currentRisk: {
        id: 'risk-2',
        overallRisk: 42,
        riskLevel: 'MEDIUM',
        weatherRisk: 38,
        ndviRisk: 35,
        soilRisk: 40,
        pestRisk: 45,
        marketRisk: 52,
        yieldImpact: 8,
        repaymentRisk: 12,
        confidence: 88,
        calculationDate: today.toISOString(),
        geminiSummary: 'Soybean crop in good health with moderate risk levels. Adequate rainfall in forecast will support flowering stage. Market prices showing slight volatility.',
        geminiRecommendations: JSON.stringify([
          'Monitor flowering progress and apply recommended nutrients',
          'Watch for yellow mosaic virus symptoms',
          'Consider forward contracts to lock in current prices',
        ]),
        geminiRiskBreakdown: JSON.stringify({
          weather: 'Low risk - Good rainfall expected in next 7 days',
          pest: 'Moderate - Monitor for stem fly and leaf miner',
          soil: 'Moderate - Soil health indicators normal',
          market: 'Medium volatility - Prices fluctuating between ₹4,200-4,800/quintal',
        }),
      },
    },
    {
      id: 'field-3',
      fieldCode: 'FIELD-003',
      area: 1.2,
      latitude: 18.5104,
      longitude: 73.8467,
      currentCrop: 'Rice',
      cropStage: 'TILLERING',
      currentRisk: {
        id: 'risk-3',
        overallRisk: 35,
        riskLevel: 'LOW',
        weatherRisk: 28,
        ndviRisk: 30,
        soilRisk: 25,
        pestRisk: 38,
        marketRisk: 45,
        yieldImpact: 5,
        repaymentRisk: 8,
        confidence: 90,
        calculationDate: today.toISOString(),
        geminiSummary: 'Rice crop showing excellent progress with low overall risk. Good water availability and healthy vegetation growth. Minimal intervention required at this stage.',
        geminiRecommendations: JSON.stringify([
          'Continue current irrigation schedule',
          'Apply second dose of nitrogen fertilizer',
          'Monitor for brown planthopper',
        ]),
        geminiRiskBreakdown: JSON.stringify({
          weather: 'Low risk - Adequate monsoon rainfall pattern',
          pest: 'Low-moderate - Regular monitoring recommended',
          soil: 'Low risk - Good water retention and nutrient levels',
          market: 'Stable - MSP support ensures price floor at ₹2,183/quintal',
        }),
      },
    },
  ];

  const totalFields = mockFields.length;
  const fieldsAtRisk = mockFields.filter(
    f => f.currentRisk.riskLevel === 'HIGH' || f.currentRisk.riskLevel === 'CRITICAL'
  ).length;

  const avgRisk = mockFields.reduce((sum, f) => sum + f.currentRisk.overallRisk, 0) / totalFields;

  return {
    summary: {
      totalFields,
      fieldsAtRisk,
      averageRisk: avgRisk.toFixed(1),
    },
    fields: mockFields,
  };
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

    let dashboardData = null;
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
              fields: {
                include: {
                  riskScores: {
                    orderBy: { calculationDate: 'desc' },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });

      await prisma.$disconnect();

      if (user && user.farmerProfile) {
        const totalFields = user.farmerProfile.fields.length;
        const fieldsAtRisk = user.farmerProfile.fields.filter(
          (f) => f.riskScores[0]?.riskLevel === 'HIGH' || f.riskScores[0]?.riskLevel === 'CRITICAL'
        ).length;

        const avgRisk =
          user.farmerProfile.fields.reduce((sum, f) => sum + (f.riskScores[0]?.overallRisk || 0), 0) /
          (totalFields || 1);

        dashboardData = {
          summary: {
            totalFields,
            fieldsAtRisk,
            averageRisk: avgRisk.toFixed(1),
          },
          fields: user.farmerProfile.fields.map((field) => ({
            id: field.id,
            fieldCode: field.fieldCode,
            area: field.area,
            latitude: field.latitude,
            longitude: field.longitude,
            currentCrop: field.currentCrop,
            cropStage: field.cropStage,
            currentRisk: field.riskScores[0] || null,
          })),
        };
      }
    } catch (dbError) {
      console.log('Database not available, using mock data:', dbError.message);
      useMockData = true;
    }

    // Fallback to mock data
    if (!dashboardData || useMockData) {
      dashboardData = getMockDashboardData(userId);
    }

    res.status(200).json({
      status: 'success',
      data: dashboardData,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    if (error.message === 'Access token required' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    res.status(500).json({ status: 'error', message: 'Internal server error: ' + error.message });
  }
}
