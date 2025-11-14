import axios from 'axios';
import { logger } from '../utils/logger.js';
import { cacheService } from '../config/redis.js';

interface PestAdvisory {
  pestName: string;
  diseaseType?: string;
  cropType: string;
  severity: 'low' | 'medium' | 'high';
  probability: number;
  symptoms?: string;
  control?: string;
  validFrom: Date;
  validUntil: Date;
}

export class PestService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.PEST_API_URL || '';
  }

  /**
   * Fetch pest and disease advisories
   */
  async getAdvisories(district: string, state: string, cropType: string): Promise<PestAdvisory[]> {
    const cacheKey = `pest:advisory:${district}:${state}:${cropType}`;

    const cached = await cacheService.get<PestAdvisory[]>(cacheKey);
    if (cached) {
      logger.debug(`Pest advisory cache hit for ${district}, ${cropType}`);
      return cached;
    }

    try {
      // Mock implementation - replace with actual ICAR/IMD pest advisory API
      const advisories = this.generateMockPestAdvisories(district, state, cropType);

      // Cache for 24 hours
      await cacheService.set(cacheKey, advisories, 86400);

      logger.info(`Fetched pest advisories for ${cropType} in ${district}`);
      return advisories;
    } catch (error) {
      logger.error('Pest advisory API error:', error);
      return [];
    }
  }

  /**
   * Calculate pest risk score based on weather and crop stage
   */
  async calculatePestRisk(
    cropType: string,
    cropStage: string,
    temperature: number,
    humidity: number,
    rainfall: number
  ): Promise<number> {
    let riskScore = 0;

    // High temperature and humidity increase pest risk
    if (temperature > 30 && humidity > 70) {
      riskScore += 30;
    }

    // Recent rainfall increases fungal disease risk
    if (rainfall > 20) {
      riskScore += 25;
    }

    // Crop stage matters
    if (cropStage === 'flowering' || cropStage === 'fruiting') {
      riskScore += 20;
    }

    // Crop-specific risks
    const cropRisks: Record<string, number> = {
      rice: 15,
      cotton: 20,
      tomato: 25,
      potato: 20,
      wheat: 10,
    };

    riskScore += cropRisks[cropType.toLowerCase()] || 10;

    return Math.min(100, riskScore);
  }

  /**
   * Get pest forecast based on weather
   */
  async getPestForecast(
    cropType: string,
    district: string,
    forecastDays: number = 7
  ): Promise<
    Array<{
      date: Date;
      pestRisk: number;
      activePests: string[];
    }>
  > {
    const forecast: Array<{
      date: Date;
      pestRisk: number;
      activePests: string[];
    }> = [];

    for (let i = 0; i < forecastDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const pestRisk = 20 + Math.random() * 60; // 20-80%
      const activePests = this.getActivePestsForCrop(cropType);

      forecast.push({
        date,
        pestRisk,
        activePests: activePests.slice(0, Math.floor(Math.random() * 3) + 1),
      });
    }

    return forecast;
  }

  /**
   * Generate mock pest advisories
   */
  private generateMockPestAdvisories(district: string, state: string, cropType: string): PestAdvisory[] {
    const commonPests = this.getPestsForCrop(cropType);

    return commonPests.map((pest, index) => ({
      pestName: pest.name,
      diseaseType: pest.diseaseType,
      cropType,
      severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      probability: 0.3 + Math.random() * 0.5,
      symptoms: pest.symptoms,
      control: pest.control,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    }));
  }

  /**
   * Get common pests for a crop
   */
  private getPestsForCrop(
    cropType: string
  ): Array<{ name: string; diseaseType?: string; symptoms: string; control: string }> {
    const pestDatabase: Record<
      string,
      Array<{ name: string; diseaseType?: string; symptoms: string; control: string }>
    > = {
      rice: [
        {
          name: 'Brown Planthopper',
          symptoms: 'Yellowing and wilting of plants, hopperburn',
          control: 'Use neem-based pesticides, maintain field hygiene',
        },
        {
          name: 'Blast Disease',
          diseaseType: 'Fungal',
          symptoms: 'Diamond-shaped lesions on leaves',
          control: 'Apply Tricyclazole fungicide, use resistant varieties',
        },
      ],
      cotton: [
        {
          name: 'Bollworm',
          symptoms: 'Damaged bolls, webbing on flowers and bolls',
          control: 'Use Bt cotton varieties, apply biological control agents',
        },
        {
          name: 'Aphids',
          symptoms: 'Curling of leaves, honeydew secretion',
          control: 'Spray neem oil, introduce ladybird beetles',
        },
      ],
      wheat: [
        {
          name: 'Rust Disease',
          diseaseType: 'Fungal',
          symptoms: 'Orange-brown pustules on leaves and stems',
          control: 'Use resistant varieties, apply fungicides if severe',
        },
      ],
      tomato: [
        {
          name: 'Late Blight',
          diseaseType: 'Fungal',
          symptoms: 'Dark lesions on leaves and fruits',
          control: 'Apply copper-based fungicides, ensure good drainage',
        },
        {
          name: 'Whitefly',
          symptoms: 'Yellowing of leaves, stunted growth',
          control: 'Use yellow sticky traps, apply neem oil',
        },
      ],
    };

    return pestDatabase[cropType.toLowerCase()] || pestDatabase.rice;
  }

  /**
   * Get active pests for a crop
   */
  private getActivePestsForCrop(cropType: string): string[] {
    const pests = this.getPestsForCrop(cropType);
    return pests.map((p) => p.name);
  }
}

export const pestService = new PestService();
