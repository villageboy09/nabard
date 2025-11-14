import axios from 'axios';
import { logger } from '../utils/logger.js';
import { cacheService } from '../config/redis.js';
import { InternalServerError } from '../utils/errors.js';

interface WeatherForecast {
  date: Date;
  tempMin: number;
  tempMax: number;
  tempAvg: number;
  rainfall: number;
  humidity: number;
  windSpeed: number;
  solarRadiation?: number;
  heatStressIndex?: number;
}

export class WeatherService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY || '';
    this.apiUrl = process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5';
  }

  /**
   * Fetch 7-15 day weather forecast for a location
   */
  async getForecast(lat: number, lon: number, days: number = 15): Promise<WeatherForecast[]> {
    const cacheKey = `weather:forecast:${lat}:${lon}:${days}`;

    // Check cache first
    const cached = await cacheService.get<WeatherForecast[]>(cacheKey);
    if (cached) {
      logger.debug(`Weather forecast cache hit for ${lat},${lon}`);
      return cached;
    }

    try {
      // Using OpenWeatherMap One Call API 3.0
      const response = await axios.get(`${this.apiUrl}/onecall`, {
        params: {
          lat,
          lon,
          exclude: 'current,minutely,hourly,alerts',
          units: 'metric',
          appid: this.apiKey,
        },
        timeout: 10000,
      });

      const forecasts: WeatherForecast[] = response.data.daily
        .slice(0, days)
        .map((day: any) => ({
          date: new Date(day.dt * 1000),
          tempMin: day.temp.min,
          tempMax: day.temp.max,
          tempAvg: day.temp.day,
          rainfall: day.rain || 0,
          humidity: day.humidity,
          windSpeed: day.wind_speed * 3.6, // Convert m/s to km/h
          solarRadiation: day.uvi ? day.uvi * 40 : undefined, // Rough conversion
          heatStressIndex: this.calculateHeatStressIndex(day.temp.max, day.humidity),
        }));

      // Cache for 6 hours
      await cacheService.set(cacheKey, forecasts, 21600);

      logger.info(`Fetched weather forecast for ${lat},${lon}`);
      return forecasts;
    } catch (error) {
      logger.error('Weather API error:', error);
      throw new InternalServerError('Failed to fetch weather data');
    }
  }

  /**
   * Get historical weather data
   */
  async getHistoricalWeather(lat: number, lon: number, date: Date): Promise<WeatherForecast | null> {
    const cacheKey = `weather:historical:${lat}:${lon}:${date.toISOString()}`;

    const cached = await cacheService.get<WeatherForecast>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const timestamp = Math.floor(date.getTime() / 1000);
      const response = await axios.get(`${this.apiUrl}/onecall/timemachine`, {
        params: {
          lat,
          lon,
          dt: timestamp,
          units: 'metric',
          appid: this.apiKey,
        },
        timeout: 10000,
      });

      const data = response.data.current;
      const weather: WeatherForecast = {
        date: new Date(data.dt * 1000),
        tempMin: data.temp,
        tempMax: data.temp,
        tempAvg: data.temp,
        rainfall: data.rain?.['1h'] || 0,
        humidity: data.humidity,
        windSpeed: data.wind_speed * 3.6,
        heatStressIndex: this.calculateHeatStressIndex(data.temp, data.humidity),
      };

      // Cache for 24 hours (historical data doesn't change)
      await cacheService.set(cacheKey, weather, 86400);

      return weather;
    } catch (error) {
      logger.error('Historical weather API error:', error);
      return null;
    }
  }

  /**
   * Calculate heat stress index (0-100)
   * Based on temperature and humidity
   */
  private calculateHeatStressIndex(temp: number, humidity: number): number {
    if (temp < 30) return 0;

    // Simple heat index calculation
    const heatIndex =
      -8.78469476 +
      1.61139411 * temp +
      2.33854884 * humidity +
      -0.14611605 * temp * humidity +
      -0.012308094 * temp * temp +
      -0.016424828 * humidity * humidity +
      0.002211732 * temp * temp * humidity +
      0.00072546 * temp * humidity * humidity +
      -0.000003582 * temp * temp * humidity * humidity;

    // Normalize to 0-100 scale
    if (heatIndex < 27) return 0;
    if (heatIndex < 32) return 25;
    if (heatIndex < 41) return 50;
    if (heatIndex < 54) return 75;
    return 100;
  }

  /**
   * Detect extreme weather events in forecast
   */
  async detectExtremeEvents(
    lat: number,
    lon: number
  ): Promise<Array<{ type: string; date: Date; severity: string; details: string }>> {
    const forecast = await this.getForecast(lat, lon, 15);
    const extremeEvents: Array<{ type: string; date: Date; severity: string; details: string }> = [];

    forecast.forEach((day) => {
      // Heatwave detection
      if (day.tempMax > 40) {
        extremeEvents.push({
          type: 'HEATWAVE',
          date: day.date,
          severity: day.tempMax > 45 ? 'CRITICAL' : 'WARNING',
          details: `Maximum temperature expected: ${day.tempMax.toFixed(1)}°C`,
        });
      }

      // Heavy rainfall detection
      if (day.rainfall > 50) {
        extremeEvents.push({
          type: 'HEAVY_RAINFALL',
          date: day.date,
          severity: day.rainfall > 100 ? 'CRITICAL' : 'WARNING',
          details: `Heavy rainfall expected: ${day.rainfall.toFixed(1)}mm`,
        });
      }

      // Frost risk
      if (day.tempMin < 5) {
        extremeEvents.push({
          type: 'FROST',
          date: day.date,
          severity: day.tempMin < 0 ? 'CRITICAL' : 'WARNING',
          details: `Low temperature expected: ${day.tempMin.toFixed(1)}°C`,
        });
      }

      // High heat stress
      if (day.heatStressIndex && day.heatStressIndex > 75) {
        extremeEvents.push({
          type: 'HEAT_STRESS',
          date: day.date,
          severity: 'WARNING',
          details: `High heat stress expected. Heat index: ${day.heatStressIndex.toFixed(0)}`,
        });
      }
    });

    return extremeEvents;
  }

  /**
   * Calculate rainfall deviation from normal
   */
  calculateRainfallDeviation(actual: number, normal: number): number {
    if (normal === 0) return actual > 0 ? 100 : 0;
    return ((actual - normal) / normal) * 100;
  }
}

export const weatherService = new WeatherService();
