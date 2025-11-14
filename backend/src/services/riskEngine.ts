import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { weatherService } from './weatherService.js';
import { satelliteService } from './satelliteService.js';
import { pestService } from './pestService.js';
import { marketService } from './marketService.js';

interface RiskComponents {
  weatherRisk: number;
  ndviRisk: number;
  soilMoistureRisk: number;
  pestRisk: number;
  marketRisk: number;
}

interface RiskCalculationResult {
  overallRisk: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  components: RiskComponents;
  yieldImpact: number;
  repaymentRisk: number;
  confidence: number;
}

export class RiskEngine {
  // Risk weights (must sum to 1.0)
  private readonly WEIGHTS = {
    weather: 0.25,
    ndvi: 0.25,
    soilMoisture: 0.10,
    pest: 0.20,
    market: 0.20,
  };

  /**
   * Calculate comprehensive risk score for a field
   */
  async calculateFieldRisk(fieldId: string, forecastDate: Date): Promise<RiskCalculationResult> {
    logger.info(`Calculating risk for field ${fieldId} on ${forecastDate.toISOString()}`);

    try {
      // Fetch field details
      const field = await prisma.field.findUnique({
        where: { id: fieldId },
        include: {
          farmerProfile: true,
        },
      });

      if (!field) {
        throw new Error(`Field ${fieldId} not found`);
      }

      // Calculate individual risk components in parallel
      const [weatherRisk, ndviRisk, soilMoistureRisk, pestRisk, marketRisk] = await Promise.all([
        this.calculateWeatherRisk(field, forecastDate),
        this.calculateNDVIRisk(field, forecastDate),
        this.calculateSoilMoistureRisk(field),
        this.calculatePestRisk(field),
        this.calculateMarketRisk(field),
      ]);

      const components: RiskComponents = {
        weatherRisk,
        ndviRisk,
        soilMoistureRisk,
        pestRisk,
        marketRisk,
      };

      // Calculate weighted overall risk
      const overallRisk =
        weatherRisk * this.WEIGHTS.weather +
        ndviRisk * this.WEIGHTS.ndvi +
        soilMoistureRisk * this.WEIGHTS.soilMoisture +
        pestRisk * this.WEIGHTS.pest +
        marketRisk * this.WEIGHTS.market;

      // Determine risk level
      const riskLevel = this.getRiskLevel(overallRisk);

      // Calculate yield impact (higher risk = more yield loss)
      const yieldImpact = this.calculateYieldImpact(components);

      // Calculate repayment risk
      const repaymentRisk = this.calculateRepaymentRisk(overallRisk, yieldImpact);

      // Calculate confidence score
      const confidence = this.calculateConfidence(components);

      const result: RiskCalculationResult = {
        overallRisk,
        riskLevel,
        components,
        yieldImpact,
        repaymentRisk,
        confidence,
      };

      logger.info(`Risk calculation complete for ${fieldId}: Overall=${overallRisk.toFixed(2)}, Level=${riskLevel}`);

      return result;
    } catch (error) {
      logger.error(`Error calculating risk for field ${fieldId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate weather-related risk (0-100)
   */
  private async calculateWeatherRisk(field: any, forecastDate: Date): Promise<number> {
    try {
      const forecast = await weatherService.getForecast(field.latitude, field.longitude, 15);

      // Find forecast for the specific date
      const dayForecast = forecast.find((f) => {
        const fDate = new Date(f.date);
        return fDate.toDateString() === forecastDate.toDateString();
      });

      if (!dayForecast) {
        logger.warn(`No weather forecast found for ${forecastDate.toISOString()}`);
        return 30; // Default moderate risk
      }

      let riskScore = 0;

      // Temperature extremes
      if (dayForecast.tempMax > 40) {
        riskScore += 30; // Extreme heat
      } else if (dayForecast.tempMax > 35) {
        riskScore += 15; // High heat
      }

      if (dayForecast.tempMin < 5) {
        riskScore += 25; // Frost risk
      }

      // Rainfall
      if (dayForecast.rainfall > 100) {
        riskScore += 30; // Heavy rainfall
      } else if (dayForecast.rainfall > 50) {
        riskScore += 15; // Moderate rainfall
      } else if (dayForecast.rainfall < 1 && (field.irrigationType === 'Rainfed' || !field.irrigationType)) {
        riskScore += 10; // Drought risk for rainfed crops
      }

      // Heat stress
      if (dayForecast.heatStressIndex && dayForecast.heatStressIndex > 75) {
        riskScore += 20;
      }

      // Wind damage
      if (dayForecast.windSpeed > 40) {
        riskScore += 15;
      }

      return Math.min(100, riskScore);
    } catch (error) {
      logger.error('Error calculating weather risk:', error);
      return 30; // Default risk
    }
  }

  /**
   * Calculate NDVI-based crop health risk (0-100)
   */
  private async calculateNDVIRisk(field: any, forecastDate: Date): Promise<number> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 60); // Last 60 days

      const satelliteData = await satelliteService.getVegetationIndices(
        field.latitude,
        field.longitude,
        startDate,
        endDate
      );

      if (satelliteData.length === 0) {
        return 50; // No data = moderate risk
      }

      // Get latest NDVI
      const latest = satelliteData[satelliteData.length - 1];

      // NDVI-based risk
      let riskScore = 0;

      if (latest.ndvi < 0.2) {
        riskScore = 90; // Critical
      } else if (latest.ndvi < 0.3) {
        riskScore = 70; // Poor
      } else if (latest.ndvi < 0.5) {
        riskScore = 40; // Fair
      } else if (latest.ndvi < 0.7) {
        riskScore = 15; // Good
      } else {
        riskScore = 5; // Excellent
      }

      // Check for declining trend
      const decline = await satelliteService.detectNDVIDecline(satelliteData);
      if (decline.isDecline) {
        riskScore += 25; // Increase risk if declining
      }

      // Stress level
      riskScore = (riskScore + latest.stressLevel) / 2;

      return Math.min(100, riskScore);
    } catch (error) {
      logger.error('Error calculating NDVI risk:', error);
      return 50;
    }
  }

  /**
   * Calculate soil moisture risk (0-100)
   */
  private async calculateSoilMoistureRisk(field: any): Promise<number> {
    try {
      // Get latest soil data
      const soilData = await prisma.soilData.findFirst({
        where: { fieldId: field.id },
        orderBy: { measurementDate: 'desc' },
      });

      if (!soilData) {
        return 40; // No data = moderate risk
      }

      let riskScore = 0;

      // Moisture deficit
      if (soilData.moistureDeficit) {
        riskScore = soilData.moistureDeficit;
      } else if (soilData.moisture) {
        // Calculate deficit from moisture percentage
        if (soilData.moisture < 10) {
          riskScore = 80; // Very dry
        } else if (soilData.moisture < 20) {
          riskScore = 50; // Dry
        } else if (soilData.moisture < 30) {
          riskScore = 20; // Adequate
        } else {
          riskScore = 10; // Good
        }
      }

      // pH extremes
      if (soilData.ph && (soilData.ph < 5.5 || soilData.ph > 8.5)) {
        riskScore += 15;
      }

      // Nutrient deficiency
      if (soilData.nitrogen && soilData.nitrogen < 150) {
        riskScore += 10;
      }

      return Math.min(100, riskScore);
    } catch (error) {
      logger.error('Error calculating soil moisture risk:', error);
      return 40;
    }
  }

  /**
   * Calculate pest and disease risk (0-100)
   */
  private async calculatePestRisk(field: any): Promise<number> {
    try {
      if (!field.currentCrop) {
        return 20; // No crop = low risk
      }

      // Get weather for pest risk calculation
      const forecast = await weatherService.getForecast(field.latitude, field.longitude, 7);
      const todayWeather = forecast[0];

      // Calculate pest risk based on weather and crop
      const pestRisk = await pestService.calculatePestRisk(
        field.currentCrop,
        field.cropStage || 'vegetative',
        todayWeather.tempAvg,
        todayWeather.humidity,
        todayWeather.rainfall
      );

      // Get advisories
      const advisories = await pestService.getAdvisories(
        field.farmerProfile.district,
        field.farmerProfile.state,
        field.currentCrop
      );

      // Increase risk if high-severity advisories present
      const highSeverityCount = advisories.filter((a) => a.severity === 'high').length;
      const adjustedRisk = pestRisk + highSeverityCount * 10;

      return Math.min(100, adjustedRisk);
    } catch (error) {
      logger.error('Error calculating pest risk:', error);
      return 30;
    }
  }

  /**
   * Calculate market price risk (0-100)
   */
  private async calculateMarketRisk(field: any): Promise<number> {
    try {
      if (!field.currentCrop) {
        return 20; // No crop = low risk
      }

      const priceCrashRisk = await marketService.detectPriceCrashRisk(
        field.currentCrop,
        field.farmerProfile.district
      );

      return priceCrashRisk.riskLevel;
    } catch (error) {
      logger.error('Error calculating market risk:', error);
      return 30;
    }
  }

  /**
   * Determine risk level from score
   */
  private getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 75) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 25) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Calculate expected yield impact (% reduction)
   */
  private calculateYieldImpact(components: RiskComponents): number {
    // Weather and NDVI have highest impact on yield
    const weatherImpact = (components.weatherRisk / 100) * 30; // Max 30% from weather
    const ndviImpact = (components.ndviRisk / 100) * 35; // Max 35% from crop health
    const pestImpact = (components.pestRisk / 100) * 20; // Max 20% from pests
    const soilImpact = (components.soilMoistureRisk / 100) * 15; // Max 15% from soil

    const totalImpact = weatherImpact + ndviImpact + pestImpact + soilImpact;

    return Math.min(100, totalImpact);
  }

  /**
   * Calculate loan repayment risk (0-100)
   */
  private calculateRepaymentRisk(overallRisk: number, yieldImpact: number): number {
    // Repayment risk is a function of overall risk and yield impact
    // Higher yield loss = higher repayment risk

    const baseRisk = overallRisk * 0.6; // 60% weight to overall risk
    const yieldRisk = yieldImpact * 0.4; // 40% weight to yield impact

    return Math.min(100, baseRisk + yieldRisk);
  }

  /**
   * Calculate confidence in the risk assessment (0-1)
   */
  private calculateConfidence(components: RiskComponents): number {
    // Confidence based on data availability and quality
    // For now, return a fixed high confidence
    // In production, this would factor in:
    // - Freshness of satellite data
    // - Weather forecast accuracy
    // - Historical prediction accuracy
    return 0.85;
  }

  /**
   * Calculate risk for all fields of a farmer
   */
  async calculateFarmerRisks(farmerId: string, forecastDate: Date): Promise<Map<string, RiskCalculationResult>> {
    const fields = await prisma.field.findMany({
      where: {
        farmerProfile: {
          farmerId: farmerId,
        },
      },
    });

    const risksMap = new Map<string, RiskCalculationResult>();

    for (const field of fields) {
      try {
        const risk = await this.calculateFieldRisk(field.id, forecastDate);
        risksMap.set(field.id, risk);
      } catch (error) {
        logger.error(`Error calculating risk for field ${field.id}:`, error);
      }
    }

    return risksMap;
  }

  /**
   * Save risk score to database
   */
  async saveRiskScore(fieldId: string, forecastDate: Date, risk: RiskCalculationResult): Promise<void> {
    await prisma.riskScore.upsert({
      where: {
        fieldId_forecastDate: {
          fieldId,
          forecastDate,
        },
      },
      create: {
        fieldId,
        calculationDate: new Date(),
        forecastDate,
        weatherRisk: risk.components.weatherRisk,
        ndviRisk: risk.components.ndviRisk,
        soilMoistureRisk: risk.components.soilMoistureRisk,
        pestRisk: risk.components.pestRisk,
        marketRisk: risk.components.marketRisk,
        overallRisk: risk.overallRisk,
        riskLevel: risk.riskLevel,
        yieldImpact: risk.yieldImpact,
        repaymentRisk: risk.repaymentRisk,
        confidence: risk.confidence,
      },
      update: {
        calculationDate: new Date(),
        weatherRisk: risk.components.weatherRisk,
        ndviRisk: risk.components.ndviRisk,
        soilMoistureRisk: risk.components.soilMoistureRisk,
        pestRisk: risk.components.pestRisk,
        marketRisk: risk.components.marketRisk,
        overallRisk: risk.overallRisk,
        riskLevel: risk.riskLevel,
        yieldImpact: risk.yieldImpact,
        repaymentRisk: risk.repaymentRisk,
        confidence: risk.confidence,
      },
    });

    logger.info(`Saved risk score for field ${fieldId}, forecast date ${forecastDate.toISOString()}`);
  }
}

export const riskEngine = new RiskEngine();
