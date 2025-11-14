import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../config/database.js';
import { weatherService } from '../services/weatherService.js';
import { satelliteService } from '../services/satelliteService.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export class FieldController {
  /**
   * Get all fields for authenticated user
   * GET /api/fields
   */
  async getFields(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;

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

      if (!user?.farmerProfile) {
        throw new ValidationError('Farmer profile not found');
      }

      res.json({
        status: 'success',
        data: user.farmerProfile.fields,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get field details with latest data
   * GET /api/fields/:fieldId
   */
  async getFieldDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { fieldId } = req.params;

      const field = await prisma.field.findUnique({
        where: { id: fieldId },
        include: {
          riskScores: {
            orderBy: { forecastDate: 'asc' },
            take: 15, // Next 15 days
            where: {
              forecastDate: {
                gte: new Date(),
              },
            },
          },
          weatherData: {
            orderBy: { forecastDate: 'asc' },
            take: 15,
            where: {
              forecastDate: {
                gte: new Date(),
              },
            },
          },
          satelliteData: {
            orderBy: { captureDate: 'desc' },
            take: 10,
          },
          soilData: {
            orderBy: { measurementDate: 'desc' },
            take: 1,
          },
        },
      });

      if (!field) {
        throw new NotFoundError('Field not found');
      }

      res.json({
        status: 'success',
        data: field,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get weather forecast for a field
   * GET /api/fields/:fieldId/weather
   */
  async getWeatherForecast(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { fieldId } = req.params;
      const { days = 15 } = req.query;

      const field = await prisma.field.findUnique({
        where: { id: fieldId },
      });

      if (!field) {
        throw new NotFoundError('Field not found');
      }

      const forecast = await weatherService.getForecast(field.latitude, field.longitude, Number(days));

      const extremeEvents = await weatherService.detectExtremeEvents(field.latitude, field.longitude);

      res.json({
        status: 'success',
        data: {
          forecast,
          extremeEvents,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get satellite data for a field
   * GET /api/fields/:fieldId/satellite
   */
  async getSatelliteData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { fieldId } = req.params;
      const { days = 60 } = req.query;

      const field = await prisma.field.findUnique({
        where: { id: fieldId },
      });

      if (!field) {
        throw new NotFoundError('Field not found');
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      const satelliteData = await satelliteService.getVegetationIndices(
        field.latitude,
        field.longitude,
        startDate,
        endDate
      );

      const decline = await satelliteService.detectNDVIDecline(satelliteData);

      res.json({
        status: 'success',
        data: {
          satelliteData,
          trend: decline,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new field
   * POST /api/fields
   */
  async createField(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { fieldCode, area, latitude, longitude, soilType, irrigationType, currentCrop, sowingDate } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { farmerProfile: true },
      });

      if (!user?.farmerProfile) {
        throw new ValidationError('Farmer profile not found');
      }

      const field = await prisma.field.create({
        data: {
          farmerProfileId: user.farmerProfile.id,
          fieldCode,
          area,
          latitude,
          longitude,
          soilType,
          irrigationType,
          currentCrop,
          sowingDate: sowingDate ? new Date(sowingDate) : null,
        },
      });

      res.status(201).json({
        status: 'success',
        data: field,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update field
   * PATCH /api/fields/:fieldId
   */
  async updateField(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { fieldId } = req.params;
      const updateData = req.body;

      const field = await prisma.field.update({
        where: { id: fieldId },
        data: updateData,
      });

      res.json({
        status: 'success',
        data: field,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const fieldController = new FieldController();
