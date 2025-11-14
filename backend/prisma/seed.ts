import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger.js';

const prisma = new PrismaClient();

async function main() {
  logger.info('🌱 Starting database seed...');

  // Create demo users
  logger.info('Creating demo users...');

  const farmer1 = await prisma.user.create({
    data: {
      email: 'farmer1@demo.com',
      phone: '+919876543210',
      password: '$2a$10$YourHashedPasswordHere', // In production, properly hash passwords
      name: 'Rajesh Kumar',
      role: 'FARMER',
      farmerProfile: {
        create: {
          farmerId: 'FRM-2024-001',
          district: 'Wardha',
          state: 'Maharashtra',
          language: 'hi',
        },
      },
    },
    include: { farmerProfile: true },
  });

  const farmer2 = await prisma.user.create({
    data: {
      email: 'farmer2@demo.com',
      phone: '+919876543211',
      password: '$2a$10$YourHashedPasswordHere',
      name: 'Priya Devi',
      role: 'FARMER',
      farmerProfile: {
        create: {
          farmerId: 'FRM-2024-002',
          district: 'Yavatmal',
          state: 'Maharashtra',
          language: 'hi',
        },
      },
    },
    include: { farmerProfile: true },
  });

  const lender1 = await prisma.user.create({
    data: {
      email: 'lender@demo.com',
      phone: '+919876543212',
      password: '$2a$10$YourHashedPasswordHere',
      name: 'NABARD Regional Office',
      role: 'LENDER',
      lenderProfile: {
        create: {
          institutionName: 'NABARD Maharashtra',
          licenseNumber: 'NBRD-MH-001',
          district: 'Nagpur',
          state: 'Maharashtra',
        },
      },
    },
    include: { lenderProfile: true },
  });

  logger.info('✓ Created 3 demo users');

  // Create fields for farmer1
  logger.info('Creating fields...');

  const field1 = await prisma.field.create({
    data: {
      farmerProfileId: farmer1.farmerProfile!.id,
      fieldCode: 'FIELD-001',
      area: 2.5,
      latitude: 20.7467,
      longitude: 78.6014,
      boundary: {
        type: 'Polygon',
        coordinates: [
          [
            [78.6014, 20.7467],
            [78.6024, 20.7467],
            [78.6024, 20.7477],
            [78.6014, 20.7477],
            [78.6014, 20.7467],
          ],
        ],
      },
      soilType: 'Clay Loam',
      irrigationType: 'Drip',
      currentCrop: 'Cotton',
      cropVariety: 'Bt Cotton',
      sowingDate: new Date('2024-06-15'),
      expectedHarvest: new Date('2025-01-15'),
      cropStage: 'flowering',
    },
  });

  const field2 = await prisma.field.create({
    data: {
      farmerProfileId: farmer1.farmerProfile!.id,
      fieldCode: 'FIELD-002',
      area: 1.8,
      latitude: 20.7500,
      longitude: 78.6050,
      soilType: 'Sandy Loam',
      irrigationType: 'Sprinkler',
      currentCrop: 'Soybean',
      cropVariety: 'JS 335',
      sowingDate: new Date('2024-07-01'),
      expectedHarvest: new Date('2024-11-30'),
      cropStage: 'vegetative',
    },
  });

  const field3 = await prisma.field.create({
    data: {
      farmerProfileId: farmer2.farmerProfile!.id,
      fieldCode: 'FIELD-003',
      area: 3.2,
      latitude: 20.3897,
      longitude: 78.1289,
      soilType: 'Black Cotton Soil',
      irrigationType: 'Rainfed',
      currentCrop: 'Rice',
      cropVariety: 'Swarna',
      sowingDate: new Date('2024-06-20'),
      expectedHarvest: new Date('2024-12-15'),
      cropStage: 'tillering',
    },
  });

  logger.info('✓ Created 3 fields');

  // Create weather data for next 15 days
  logger.info('Creating weather data...');

  for (let day = 0; day < 15; day++) {
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + day);

    // Field 1 weather
    await prisma.weatherData.create({
      data: {
        fieldId: field1.id,
        date: new Date(),
        forecastDate,
        isForecast: true,
        tempMin: 22 + Math.random() * 3,
        tempMax: 35 + Math.random() * 5,
        tempAvg: 28 + Math.random() * 4,
        rainfall: day % 3 === 0 ? 5 + Math.random() * 15 : 0,
        humidity: 65 + Math.random() * 15,
        windSpeed: 10 + Math.random() * 10,
        heatStressIndex: 20 + Math.random() * 30,
      },
    });

    // Field 2 weather
    await prisma.weatherData.create({
      data: {
        fieldId: field2.id,
        date: new Date(),
        forecastDate,
        isForecast: true,
        tempMin: 21 + Math.random() * 3,
        tempMax: 34 + Math.random() * 5,
        tempAvg: 27 + Math.random() * 4,
        rainfall: day % 4 === 0 ? 3 + Math.random() * 10 : 0,
        humidity: 60 + Math.random() * 15,
        windSpeed: 8 + Math.random() * 8,
        heatStressIndex: 15 + Math.random() * 25,
      },
    });

    // Field 3 weather (more rainfall for rice)
    await prisma.weatherData.create({
      data: {
        fieldId: field3.id,
        date: new Date(),
        forecastDate,
        isForecast: true,
        tempMin: 23 + Math.random() * 3,
        tempMax: 32 + Math.random() * 4,
        tempAvg: 27 + Math.random() * 3,
        rainfall: day % 2 === 0 ? 10 + Math.random() * 20 : 2,
        humidity: 75 + Math.random() * 10,
        windSpeed: 12 + Math.random() * 8,
        heatStressIndex: 10 + Math.random() * 20,
      },
    });
  }

  logger.info('✓ Created weather data for 15 days');

  // Create satellite data (weekly for past 60 days)
  logger.info('Creating satellite data...');

  for (let week = 0; week < 10; week++) {
    const captureDate = new Date();
    captureDate.setDate(captureDate.getDate() - week * 7);

    // Simulate crop growth - NDVI increases then plateaus
    const growthFactor = Math.min(week / 10, 0.8);

    await prisma.satelliteData.create({
      data: {
        fieldId: field1.id,
        captureDate,
        source: 'sentinel-2',
        ndvi: 0.4 + growthFactor * 0.35 + (Math.random() - 0.5) * 0.1,
        evi: 0.5 + growthFactor * 0.3 + (Math.random() - 0.5) * 0.1,
        savi: 0.35 + growthFactor * 0.3 + (Math.random() - 0.5) * 0.1,
        ndwi: 0.1 + (Math.random() - 0.5) * 0.15,
        healthStatus: growthFactor > 0.6 ? 'good' : growthFactor > 0.4 ? 'fair' : 'poor',
        stressLevel: (1 - growthFactor) * 40 + Math.random() * 20,
        cloudCover: Math.random() * 30,
      },
    });

    await prisma.satelliteData.create({
      data: {
        fieldId: field2.id,
        captureDate,
        source: 'sentinel-2',
        ndvi: 0.45 + growthFactor * 0.3 + (Math.random() - 0.5) * 0.1,
        evi: 0.52 + growthFactor * 0.28 + (Math.random() - 0.5) * 0.1,
        savi: 0.38 + growthFactor * 0.28 + (Math.random() - 0.5) * 0.1,
        ndwi: 0.08 + (Math.random() - 0.5) * 0.12,
        healthStatus: growthFactor > 0.6 ? 'excellent' : growthFactor > 0.4 ? 'good' : 'fair',
        stressLevel: (1 - growthFactor) * 35 + Math.random() * 15,
        cloudCover: Math.random() * 25,
      },
    });

    await prisma.satelliteData.create({
      data: {
        fieldId: field3.id,
        captureDate,
        source: 'sentinel-2',
        ndvi: 0.5 + growthFactor * 0.25 + (Math.random() - 0.5) * 0.1,
        evi: 0.55 + growthFactor * 0.25 + (Math.random() - 0.5) * 0.1,
        savi: 0.42 + growthFactor * 0.25 + (Math.random() - 0.5) * 0.1,
        ndwi: 0.15 + (Math.random() - 0.5) * 0.1,
        healthStatus: growthFactor > 0.6 ? 'excellent' : growthFactor > 0.4 ? 'good' : 'fair',
        stressLevel: (1 - growthFactor) * 30 + Math.random() * 15,
        cloudCover: Math.random() * 20,
      },
    });
  }

  logger.info('✓ Created satellite data (10 weeks)');

  // Create soil data
  logger.info('Creating soil data...');

  await prisma.soilData.create({
    data: {
      fieldId: field1.id,
      measurementDate: new Date(),
      moisture: 35,
      ph: 7.2,
      nitrogen: 250,
      phosphorus: 18,
      potassium: 180,
      organicCarbon: 0.65,
      moistureDeficit: 25,
    },
  });

  await prisma.soilData.create({
    data: {
      fieldId: field2.id,
      measurementDate: new Date(),
      moisture: 28,
      ph: 6.8,
      nitrogen: 220,
      phosphorus: 15,
      potassium: 160,
      organicCarbon: 0.55,
      moistureDeficit: 35,
    },
  });

  await prisma.soilData.create({
    data: {
      fieldId: field3.id,
      measurementDate: new Date(),
      moisture: 45,
      ph: 7.5,
      nitrogen: 280,
      phosphorus: 22,
      potassium: 200,
      organicCarbon: 0.75,
      moistureDeficit: 15,
    },
  });

  logger.info('✓ Created soil data');

  // Create risk scores with AI analysis
  logger.info('Creating risk scores...');

  for (let day = 1; day <= 7; day++) {
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + day);

    // Field 1 - Medium to High risk
    const field1Risk = 45 + day * 3 + Math.random() * 10;
    await prisma.riskScore.create({
      data: {
        fieldId: field1.id,
        calculationDate: new Date(),
        forecastDate,
        weatherRisk: 55 + Math.random() * 10,
        ndviRisk: 40 + Math.random() * 15,
        soilMoistureRisk: 35 + Math.random() * 10,
        pestRisk: 50 + Math.random() * 15,
        marketRisk: 30 + Math.random() * 10,
        overallRisk: field1Risk,
        riskLevel: field1Risk >= 75 ? 'CRITICAL' : field1Risk >= 50 ? 'HIGH' : field1Risk >= 25 ? 'MEDIUM' : 'LOW',
        yieldImpact: field1Risk * 0.4,
        repaymentRisk: field1Risk * 0.6,
        confidence: 0.82 + Math.random() * 0.1,
        geminiSummary: `The cotton crop in Field-001 is showing ${field1Risk >= 50 ? 'elevated' : 'moderate'} risk levels for day ${day}. Primary concerns include heat stress and pest pressure typical for this growth stage. Current NDVI readings indicate fair to good crop health, but weather conditions suggest potential water stress ahead.`,
        recommendations: `- Monitor soil moisture daily and irrigate as needed\n- Scout for bollworm and aphid presence\n- Consider applying foliar spray if heat stress symptoms appear\n- Maintain good drainage to prevent waterlogging from forecast rainfall\n- Review crop insurance coverage`,
      },
    });

    // Field 2 - Low to Medium risk
    const field2Risk = 25 + day * 2 + Math.random() * 8;
    await prisma.riskScore.create({
      data: {
        fieldId: field2.id,
        calculationDate: new Date(),
        forecastDate,
        weatherRisk: 30 + Math.random() * 10,
        ndviRisk: 20 + Math.random() * 10,
        soilMoistureRisk: 40 + Math.random() * 10,
        pestRisk: 25 + Math.random() * 10,
        marketRisk: 35 + Math.random() * 10,
        overallRisk: field2Risk,
        riskLevel: field2Risk >= 75 ? 'CRITICAL' : field2Risk >= 50 ? 'HIGH' : field2Risk >= 25 ? 'MEDIUM' : 'LOW',
        yieldImpact: field2Risk * 0.35,
        repaymentRisk: field2Risk * 0.5,
        confidence: 0.85 + Math.random() * 0.08,
        geminiSummary: `Soybean crop in Field-002 is in good condition with low to moderate risk levels. The vegetative stage is progressing well with adequate NDVI values. Weather conditions are favorable with occasional rainfall supporting crop growth.`,
        recommendations: `- Continue regular monitoring\n- Ensure proper weed management during vegetative stage\n- Watch for early signs of yellow mosaic virus\n- Prepare for flowering stage nutrient requirements\n- Market prices are stable, consider forward selling options`,
      },
    });

    // Field 3 - Low risk
    const field3Risk = 20 + day * 1.5 + Math.random() * 5;
    await prisma.riskScore.create({
      data: {
        fieldId: field3.id,
        calculationDate: new Date(),
        forecastDate,
        weatherRisk: 25 + Math.random() * 8,
        ndviRisk: 15 + Math.random() * 8,
        soilMoistureRisk: 20 + Math.random() * 8,
        pestRisk: 30 + Math.random() * 10,
        marketRisk: 15 + Math.random() * 8,
        overallRisk: field3Risk,
        riskLevel: 'LOW',
        yieldImpact: field3Risk * 0.3,
        repaymentRisk: field3Risk * 0.45,
        confidence: 0.88 + Math.random() * 0.08,
        geminiSummary: `Rice crop in Field-003 is performing excellently with minimal risk factors. Adequate rainfall and good tillering stage development indicate healthy crop progression. Soil moisture levels are optimal for rice cultivation.`,
        recommendations: `- Maintain current irrigation schedule\n- Apply nitrogen fertilizer at panicle initiation stage\n- Monitor for bacterial leaf blight\n- Ensure proper water depth maintenance\n- Harvest planning can proceed as scheduled`,
      },
    });
  }

  logger.info('✓ Created risk scores (7 days forecast)');

  // Create alerts
  logger.info('Creating alerts...');

  await prisma.alert.create({
    data: {
      farmerProfileId: farmer1.farmerProfile!.id,
      alertType: 'WEATHER_EXTREME',
      severity: 'WARNING',
      title: 'Heatwave Warning - Next 3 Days',
      message: 'Temperature expected to exceed 40°C for the next 3 days in Wardha district. Heat stress risk for cotton crop.',
      actionable: '• Increase irrigation frequency to twice daily\n• Apply irrigation during early morning or evening\n• Monitor crop for wilting symptoms\n• Consider providing shade if possible for young plants',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      triggered: true,
      sentAt: new Date(),
      smsSent: true,
    },
  });

  await prisma.alert.create({
    data: {
      farmerProfileId: farmer1.farmerProfile!.id,
      alertType: 'PEST_DISEASE',
      severity: 'CRITICAL',
      title: 'Bollworm Outbreak Alert',
      message: 'High severity bollworm activity reported in Wardha district. Immediate scouting and control measures recommended for cotton fields.',
      actionable: '• Scout fields daily for bollworm larvae\n• Apply recommended pesticides if threshold exceeded\n• Use pheromone traps for monitoring\n• Follow integrated pest management practices',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      triggered: true,
      sentAt: new Date(),
      smsSent: true,
    },
  });

  await prisma.alert.create({
    data: {
      farmerProfileId: farmer2.farmerProfile!.id,
      alertType: 'CROP_STRESS',
      severity: 'INFO',
      title: 'Irrigation Recommended',
      message: 'Soil moisture levels declining in your rice field. Irrigation recommended within next 48 hours.',
      actionable: '• Check water availability in irrigation source\n• Plan irrigation schedule\n• Monitor soil moisture visually\n• Ensure proper water distribution across field',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      triggered: false,
    },
  });

  await prisma.alert.create({
    data: {
      farmerProfileId: farmer1.farmerProfile!.id,
      alertType: 'MARKET_PRICE_DROP',
      severity: 'WARNING',
      title: 'Cotton Price Decline Alert',
      message: 'Cotton prices have dropped 8% in major mandis over the past week. Consider waiting for price recovery before selling.',
      actionable: '• Monitor daily mandi prices\n• Consider storage options if available\n• Check MSP support price\n• Consult with market experts for selling strategy',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      triggered: true,
      sentAt: new Date(),
      smsSent: true,
      readAt: new Date(),
    },
  });

  logger.info('✓ Created 4 alerts');

  // Create pest advisories
  logger.info('Creating pest advisories...');

  await prisma.pestAdvisory.create({
    data: {
      district: 'Wardha',
      state: 'Maharashtra',
      cropType: 'Cotton',
      pestName: 'Pink Bollworm',
      diseaseType: 'Pest',
      severity: 'high',
      probability: 0.75,
      symptoms: 'Pink larvae in bolls, boll damage, exit holes with webbing',
      control: 'Use pheromone traps, apply recommended insecticides, remove affected bolls, follow crop rotation',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.pestAdvisory.create({
    data: {
      district: 'Wardha',
      state: 'Maharashtra',
      cropType: 'Soybean',
      pestName: 'Yellow Mosaic Virus',
      diseaseType: 'Viral',
      severity: 'medium',
      probability: 0.45,
      symptoms: 'Yellow mosaic patterns on leaves, stunted growth, reduced yield',
      control: 'Control whitefly vector, use virus-resistant varieties, remove infected plants',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.pestAdvisory.create({
    data: {
      district: 'Yavatmal',
      state: 'Maharashtra',
      cropType: 'Rice',
      pestName: 'Bacterial Leaf Blight',
      diseaseType: 'Bacterial',
      severity: 'medium',
      probability: 0.55,
      symptoms: 'Water-soaked lesions on leaves, yellowing, wilting',
      control: 'Use disease-resistant varieties, apply copper-based bactericides, ensure proper drainage',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  logger.info('✓ Created pest advisories');

  // Create market prices
  logger.info('Creating market prices...');

  const crops = ['Cotton', 'Soybean', 'Rice'];
  const markets = ['Wardha APMC', 'Yavatmal Mandi', 'Nagpur Market'];

  for (const crop of crops) {
    for (const market of markets) {
      const basePrice = crop === 'Cotton' ? 6000 : crop === 'Soybean' ? 4200 : 2800;
      const variation = (Math.random() - 0.5) * 0.1;

      await prisma.marketPrice.create({
        data: {
          commodity: crop,
          variety: 'Standard',
          market,
          district: market.split(' ')[0],
          state: 'Maharashtra',
          date: new Date(),
          minPrice: basePrice * (0.9 + variation),
          maxPrice: basePrice * (1.1 + variation),
          modalPrice: basePrice * (1 + variation),
          priceChange: (Math.random() - 0.5) * 10,
          volatility: Math.random() * 15,
        },
      });
    }
  }

  logger.info('✓ Created market prices');

  // Create loans
  logger.info('Creating loans...');

  await prisma.loan.create({
    data: {
      farmerProfileId: farmer1.farmerProfile!.id,
      lenderProfileId: lender1.lenderProfile!.id,
      loanAmount: 200000,
      outstandingAmount: 120000,
      interestRate: 7.5,
      disbursedDate: new Date('2024-06-01'),
      dueDate: new Date('2025-05-31'),
      status: 'ACTIVE',
      repaymentRisk: 45,
      weatherExposure: 55,
      lastRiskUpdate: new Date(),
    },
  });

  await prisma.loan.create({
    data: {
      farmerProfileId: farmer2.farmerProfile!.id,
      lenderProfileId: lender1.lenderProfile!.id,
      loanAmount: 150000,
      outstandingAmount: 80000,
      interestRate: 7.0,
      disbursedDate: new Date('2024-06-15'),
      dueDate: new Date('2025-06-14'),
      status: 'ACTIVE',
      repaymentRisk: 25,
      weatherExposure: 30,
      lastRiskUpdate: new Date(),
    },
  });

  logger.info('✓ Created loans');

  // Create system config
  logger.info('Creating system configuration...');

  await prisma.systemConfig.createMany({
    data: [
      {
        key: 'DEMO_MODE',
        value: 'true',
        description: 'Enable demo mode with mock data',
      },
      {
        key: 'RISK_CALCULATION_ENABLED',
        value: 'true',
        description: 'Enable automated risk calculation',
      },
      {
        key: 'ALERTS_ENABLED',
        value: 'true',
        description: 'Enable alert generation and sending',
      },
      {
        key: 'DEFAULT_FORECAST_DAYS',
        value: '15',
        description: 'Default number of days for weather forecast',
      },
    ],
  });

  logger.info('✓ Created system configuration');

  logger.info('');
  logger.info('🎉 Database seeding completed successfully!');
  logger.info('');
  logger.info('📊 Summary:');
  logger.info('  - 3 users created (2 farmers, 1 lender)');
  logger.info('  - 3 fields created');
  logger.info('  - 45 weather records (15 days × 3 fields)');
  logger.info('  - 30 satellite records (10 weeks × 3 fields)');
  logger.info('  - 3 soil data records');
  logger.info('  - 21 risk scores (7 days × 3 fields)');
  logger.info('  - 4 alerts');
  logger.info('  - 3 pest advisories');
  logger.info('  - 9 market prices');
  logger.info('  - 2 loans');
  logger.info('');
  logger.info('🔑 Demo Credentials:');
  logger.info('  Farmer 1: farmer1@demo.com');
  logger.info('  Farmer 2: farmer2@demo.com');
  logger.info('  Lender:   lender@demo.com');
  logger.info('  Password: demo123 (update in production!)');
  logger.info('');
}

main()
  .catch((e) => {
    logger.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
