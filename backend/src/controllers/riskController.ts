import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { riskEngine } from '../services/riskEngine.js';
import { geminiService } from '../services/geminiService.js';
import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class RiskController {
  /**
   * Calculate risk for a specific field
   * GET /api/risks/field/:fieldId/calculate
   */
  async calculateFieldRisk(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { fieldId } = req.params;
      const { forecastDate } = req.query;

      if (!forecastDate) {
        throw new ValidationError('forecastDate query parameter required');
      }

      const date = new Date(forecastDate as string);
      if (isNaN(date.getTime())) {
        throw new ValidationError('Invalid forecastDate format');
      }

      // Calculate risk
      const risk = await riskEngine.calculateFieldRisk(fieldId, date);

      // Get field details for Gemini
      const field = await prisma.field.findUnique({
        where: { id: fieldId },
        include: { farmerProfile: true },
      });

      if (!field) {
        throw new NotFoundError('Field not found');
      }

      // Generate AI analysis
      const analysis = await geminiService.generateRiskAnalysis({
        fieldId,
        cropType: field.currentCrop || 'Unknown',
        cropStage: field.cropStage || 'Unknown',
        overallRisk: risk.overallRisk,
        riskLevel: risk.riskLevel,
        weatherRisk: risk.components.weatherRisk,
        ndviRisk: risk.components.ndviRisk,
        soilMoistureRisk: risk.components.soilMoistureRisk,
        pestRisk: risk.components.pestRisk,
        marketRisk: risk.components.marketRisk,
        yieldImpact: risk.yieldImpact,
        repaymentRisk: risk.repaymentRisk,
        district: field.farmerProfile.district,
        state: field.farmerProfile.state,
      });

      // Save to database
      await riskEngine.saveRiskScore(fieldId, date, risk);

      // Update with AI analysis
      await prisma.riskScore.update({
        where: {
          fieldId_forecastDate: {
            fieldId,
            forecastDate: date,
          },
        },
        data: {
          geminiSummary: analysis.summary,
          recommendations: analysis.recommendations,
        },
      });

      res.json({
        status: 'success',
        data: {
          risk,
          analysis,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get risk scores for a field
   * GET /api/risks/field/:fieldId
   */
  async getFieldRiskScores(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { fieldId } = req.params;
      const { startDate, endDate, limit = 30 } = req.query;

      const where: any = { fieldId };

      if (startDate && endDate) {
        where.forecastDate = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        };
      }

      const riskScores = await prisma.riskScore.findMany({
        where,
        orderBy: { forecastDate: 'asc' },
        take: Number(limit),
      });

      res.json({
        status: 'success',
        data: riskScores,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get risk scores for all farmer fields
   * GET /api/risks/farmer/:farmerId
   */
  async getFarmerRisks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { farmerId } = req.params;

      const farmerProfile = await prisma.farmerProfile.findUnique({
        where: { farmerId },
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
      });

      if (!farmerProfile) {
        throw new NotFoundError('Farmer not found');
      }

      const fieldsWithRisks = farmerProfile.fields.map((field) => ({
        fieldId: field.id,
        fieldCode: field.fieldCode,
        area: field.area,
        cropType: field.currentCrop,
        cropStage: field.cropStage,
        latestRisk: field.riskScores[0] || null,
      }));

      res.json({
        status: 'success',
        data: {
          farmerId,
          farmerName: farmerProfile.user?.name,
          district: farmerProfile.district,
          state: farmerProfile.state,
          fields: fieldsWithRisks,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get risk dashboard summary
   * GET /api/risks/dashboard
   */
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;

      // Get user profile
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

      if (!user || !user.farmerProfile) {
        throw new NotFoundError('User or farmer profile not found');
      }

      // Calculate summary statistics
      const totalFields = user.farmerProfile.fields.length;
      const fieldsAtRisk = user.farmerProfile.fields.filter(
        (f) => f.riskScores[0]?.riskLevel === 'HIGH' || f.riskScores[0]?.riskLevel === 'CRITICAL'
      ).length;

      const avgRisk =
        user.farmerProfile.fields.reduce((sum, f) => sum + (f.riskScores[0]?.overallRisk || 0), 0) /
        (totalFields || 1);

      res.json({
        status: 'success',
        data: {
          summary: {
            totalFields,
            fieldsAtRisk,
            averageRisk: avgRisk.toFixed(1),
          },
          fields: user.farmerProfile.fields.map((field) => ({
            id: field.id,
            fieldCode: field.fieldCode,
            cropType: field.currentCrop,
            area: field.area,
            currentRisk: field.riskScores[0] || null,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Trigger risk calculation for all fields (for cron job)
   * POST /api/risks/calculate-all
   */
  async calculateAllRisks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { days = 7 } = req.body;

      const fields = await prisma.field.findMany();

      logger.info(`Starting risk calculation for ${fields.length} fields, ${days} days ahead`);

      let processed = 0;
      let failed = 0;

      for (const field of fields) {
        try {
          for (let i = 1; i <= days; i++) {
            const forecastDate = new Date();
            forecastDate.setDate(forecastDate.getDate() + i);

            const risk = await riskEngine.calculateFieldRisk(field.id, forecastDate);
            await riskEngine.saveRiskScore(field.id, forecastDate, risk);
          }
          processed++;
        } catch (error) {
          logger.error(`Failed to calculate risk for field ${field.id}:`, error);
          failed++;
        }
      }

      res.json({
        status: 'success',
        data: {
          totalFields: fields.length,
          processed,
          failed,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const riskController = new RiskController();
