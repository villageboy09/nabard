import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../config/database.js';
import { ValidationError } from '../utils/errors.js';

export class AlertController {
  /**
   * Get alerts for a farmer
   * GET /api/alerts
   */
  async getAlerts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { status, severity, type, limit = 50 } = req.query;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { farmerProfile: true },
      });

      if (!user?.farmerProfile) {
        throw new ValidationError('Farmer profile not found');
      }

      const where: any = {
        farmerProfileId: user.farmerProfile.id,
      };

      if (status === 'unread') {
        where.readAt = null;
      }

      if (severity) {
        where.severity = severity;
      }

      if (type) {
        where.alertType = type;
      }

      const alerts = await prisma.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
      });

      const unreadCount = await prisma.alert.count({
        where: {
          farmerProfileId: user.farmerProfile.id,
          readAt: null,
        },
      });

      res.json({
        status: 'success',
        data: {
          alerts,
          unreadCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark alert as read
   * PATCH /api/alerts/:alertId/read
   */
  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { alertId } = req.params;

      const alert = await prisma.alert.update({
        where: { id: alertId },
        data: { readAt: new Date() },
      });

      res.json({
        status: 'success',
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get alert statistics
   * GET /api/alerts/stats
   */
  async getAlertStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { farmerProfile: true },
      });

      if (!user?.farmerProfile) {
        throw new ValidationError('Farmer profile not found');
      }

      const stats = await prisma.alert.groupBy({
        by: ['alertType', 'severity'],
        where: {
          farmerProfileId: user.farmerProfile.id,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        _count: true,
      });

      res.json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const alertController = new AlertController();
