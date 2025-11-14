import axios from 'axios';
import { logger } from '../utils/logger.js';
import { cacheService } from '../config/redis.js';
import { InternalServerError } from '../utils/errors.js';

interface SatelliteIndices {
  captureDate: Date;
  ndvi: number;
  evi: number;
  savi: number;
  ndwi: number;
  healthStatus: string;
  stressLevel: number;
  cloudCover: number;
}

export class SatelliteService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.SATELLITE_API_KEY || '';
    this.apiUrl = process.env.SATELLITE_API_URL || '';
  }

  /**
   * Fetch NDVI and other vegetation indices from Sentinel-2
   */
  async getVegetationIndices(
    lat: number,
    lon: number,
    startDate: Date,
    endDate: Date
  ): Promise<SatelliteIndices[]> {
    const cacheKey = `satellite:indices:${lat}:${lon}:${startDate.toISOString()}:${endDate.toISOString()}`;

    // Check cache
    const cached = await cacheService.get<SatelliteIndices[]>(cacheKey);
    if (cached) {
      logger.debug(`Satellite data cache hit for ${lat},${lon}`);
      return cached;
    }

    try {
      // Mock implementation for demo - replace with actual Sentinel Hub API
      // In production, use Sentinel Hub Statistical API or similar
      const indices = await this.fetchSentinelData(lat, lon, startDate, endDate);

      // Cache for 12 hours
      await cacheService.set(cacheKey, indices, 43200);

      logger.info(`Fetched satellite indices for ${lat},${lon}`);
      return indices;
    } catch (error) {
      logger.error('Satellite API error:', error);
      // Return mock data for demo purposes
      return this.generateMockSatelliteData(startDate, endDate);
    }
  }

  /**
   * Fetch actual Sentinel-2 data (to be implemented with real API)
   */
  private async fetchSentinelData(
    lat: number,
    lon: number,
    startDate: Date,
    endDate: Date
  ): Promise<SatelliteIndices[]> {
    // This would integrate with Sentinel Hub or Google Earth Engine
    // For now, returning mock data
    return this.generateMockSatelliteData(startDate, endDate);
  }

  /**
   * Generate mock satellite data for demonstration
   */
  private generateMockSatelliteData(startDate: Date, endDate: Date): SatelliteIndices[] {
    const data: SatelliteIndices[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      // Generate realistic NDVI values that show crop growth pattern
      const dayOfYear = Math.floor(
        (current.getTime() - new Date(current.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Simulate crop growth cycle
      const baseNdvi = 0.3 + 0.4 * Math.sin((dayOfYear / 365) * Math.PI * 2);
      const ndvi = Math.max(0.1, Math.min(0.9, baseNdvi + (Math.random() - 0.5) * 0.1));

      const evi = ndvi * 1.2; // EVI typically slightly higher
      const savi = ndvi * 0.9; // SAVI accounts for soil
      const ndwi = Math.random() * 0.3 - 0.1; // Water content

      data.push({
        captureDate: new Date(current),
        ndvi,
        evi,
        savi,
        ndwi,
        healthStatus: this.getHealthStatus(ndvi),
        stressLevel: this.calculateStressLevel(ndvi),
        cloudCover: Math.random() * 30, // Random cloud cover 0-30%
      });

      // Move to next week (Sentinel-2 revisit time)
      current.setDate(current.getDate() + 7);
    }

    return data;
  }

  /**
   * Determine crop health status from NDVI
   */
  private getHealthStatus(ndvi: number): string {
    if (ndvi >= 0.7) return 'excellent';
    if (ndvi >= 0.5) return 'good';
    if (ndvi >= 0.3) return 'fair';
    if (ndvi >= 0.2) return 'poor';
    return 'critical';
  }

  /**
   * Calculate stress level (0-100, higher = more stress)
   */
  private calculateStressLevel(ndvi: number): number {
    // Invert NDVI to stress level
    if (ndvi >= 0.7) return 0;
    if (ndvi >= 0.5) return 25;
    if (ndvi >= 0.3) return 50;
    if (ndvi >= 0.2) return 75;
    return 100;
  }

  /**
   * Detect NDVI decline (crop stress)
   */
  async detectNDVIDecline(indices: SatelliteIndices[]): Promise<{
    isDecline: boolean;
    percentageChange: number;
    trend: string;
  }> {
    if (indices.length < 2) {
      return { isDecline: false, percentageChange: 0, trend: 'insufficient_data' };
    }

    // Sort by date
    const sorted = indices.sort((a, b) => a.captureDate.getTime() - b.captureDate.getTime());

    // Compare last reading with average of previous readings
    const latest = sorted[sorted.length - 1].ndvi;
    const previous = sorted.slice(0, -1).reduce((sum, d) => sum + d.ndvi, 0) / (sorted.length - 1);

    const percentageChange = ((latest - previous) / previous) * 100;

    return {
      isDecline: percentageChange < -10, // 10% decline threshold
      percentageChange,
      trend: percentageChange < -10 ? 'declining' : percentageChange > 10 ? 'improving' : 'stable',
    };
  }

  /**
   * Calculate crop health score (0-100)
   */
  calculateHealthScore(ndvi: number, evi: number, ndwi: number): number {
    // Weighted combination
    const ndviScore = ndvi * 100;
    const eviScore = Math.min(evi * 100, 100);
    const waterScore = Math.max((ndwi + 0.5) * 100, 0);

    return ndviScore * 0.5 + eviScore * 0.3 + waterScore * 0.2;
  }

  /**
   * Get latest satellite reading
   */
  async getLatestReading(lat: number, lon: number): Promise<SatelliteIndices | null> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    const indices = await this.getVegetationIndices(lat, lon, startDate, endDate);

    if (indices.length === 0) return null;

    // Return the latest reading with acceptable cloud cover
    const acceptable = indices.filter((d) => d.cloudCover < 50);
    if (acceptable.length === 0) return indices[indices.length - 1];

    return acceptable[acceptable.length - 1];
  }
}

export const satelliteService = new SatelliteService();
