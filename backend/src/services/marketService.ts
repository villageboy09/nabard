import axios from 'axios';
import { logger } from '../utils/logger.js';
import { cacheService } from '../config/redis.js';

interface MarketPrice {
  commodity: string;
  variety: string;
  market: string;
  district: string;
  state: string;
  date: Date;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  priceChange?: number;
  volatility?: number;
}

export class MarketService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.MARKET_API_KEY || '';
    this.apiUrl = process.env.MARKET_API_URL || '';
  }

  /**
   * Fetch current market prices
   */
  async getCurrentPrices(commodity: string, district: string, state: string): Promise<MarketPrice[]> {
    const cacheKey = `market:prices:${commodity}:${district}:${state}`;

    const cached = await cacheService.get<MarketPrice[]>(cacheKey);
    if (cached) {
      logger.debug(`Market price cache hit for ${commodity}`);
      return cached;
    }

    try {
      // Mock implementation - replace with actual Mandi API
      const prices = this.generateMockMarketData(commodity, district, state);

      // Cache for 6 hours
      await cacheService.set(cacheKey, prices, 21600);

      logger.info(`Fetched market prices for ${commodity} in ${district}`);
      return prices;
    } catch (error) {
      logger.error('Market API error:', error);
      return [];
    }
  }

  /**
   * Calculate price trend and volatility
   */
  async getPriceTrend(
    commodity: string,
    district: string,
    days: number = 30
  ): Promise<{
    trend: number;
    volatility: number;
    isDecreasing: boolean;
  }> {
    // Mock implementation
    const trend = (Math.random() - 0.5) * 20; // -10% to +10%
    const volatility = Math.random() * 30; // 0-30%

    return {
      trend,
      volatility,
      isDecreasing: trend < -5, // Alert if price dropping more than 5%
    };
  }

  /**
   * Detect price crash risk
   */
  async detectPriceCrashRisk(commodity: string, district: string): Promise<{
    riskLevel: number;
    expectedDrop: number;
    reason: string;
  }> {
    const trend = await this.getPriceTrend(commodity, district);

    let riskLevel = 0;
    let reason = 'Prices stable';

    if (trend.isDecreasing) {
      riskLevel = Math.min(100, Math.abs(trend.trend) * 10);
      reason = `Price declining by ${Math.abs(trend.trend).toFixed(1)}%`;
    }

    if (trend.volatility > 20) {
      riskLevel = Math.max(riskLevel, 50);
      reason = `High price volatility (${trend.volatility.toFixed(1)}%)`;
    }

    return {
      riskLevel,
      expectedDrop: trend.isDecreasing ? Math.abs(trend.trend) : 0,
      reason,
    };
  }

  /**
   * Generate mock market data
   */
  private generateMockMarketData(commodity: string, district: string, state: string): MarketPrice[] {
    const basePrice = this.getBasePriceForCommodity(commodity);
    const markets = ['Main Mandi', 'APMC Yard', 'Wholesale Market'];

    return markets.map((market) => {
      const variation = (Math.random() - 0.5) * 0.2; // ±10%
      const modalPrice = basePrice * (1 + variation);

      return {
        commodity,
        variety: 'Standard',
        market,
        district,
        state,
        date: new Date(),
        minPrice: modalPrice * 0.9,
        maxPrice: modalPrice * 1.1,
        modalPrice,
        priceChange: (Math.random() - 0.5) * 10,
        volatility: Math.random() * 20,
      };
    });
  }

  /**
   * Get base price for commodity (Rs per quintal)
   */
  private getBasePriceForCommodity(commodity: string): number {
    const basePrices: Record<string, number> = {
      wheat: 2000,
      rice: 2500,
      cotton: 6000,
      sugarcane: 3000,
      maize: 1800,
      soybean: 4000,
      tomato: 1500,
      onion: 1200,
      potato: 1000,
    };

    return basePrices[commodity.toLowerCase()] || 2000;
  }
}

export const marketService = new MarketService();
