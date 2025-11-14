import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { riskEngine } from '../services/riskEngine.js';
import { geminiService } from '../services/geminiService.js';
import { weatherService } from '../services/weatherService.js';
import { pestService } from '../services/pestService.js';

class AlertsEngine {
  /**
   * Start the alerts engine cron job
   */
  start() {
    const schedule = process.env.RISK_CRON_SCHEDULE || '0 6 * * *'; // Daily at 6 AM

    logger.info(`Starting Alerts Engine with schedule: ${schedule}`);

    // Schedule daily risk calculation and alert generation
    cron.schedule(schedule, async () => {
      logger.info('🔔 Running scheduled alerts engine...');
      await this.runDailyAlerts();
    });

    logger.info('✅ Alerts Engine scheduled successfully');
  }

  /**
   * Main alerts generation workflow
   */
  async runDailyAlerts() {
    try {
      logger.info('Starting daily alerts workflow');

      // Step 1: Calculate risks for all fields for next 7-15 days
      await this.calculateAllFieldRisks();

      // Step 2: Generate alerts based on risk scores
      await this.generateRiskAlerts();

      // Step 3: Generate weather-based alerts
      await this.generateWeatherAlerts();

      // Step 4: Generate pest-based alerts
      await this.generatePestAlerts();

      // Step 5: Send all unsent alerts
      await this.sendPendingAlerts();

      logger.info('✅ Daily alerts workflow completed successfully');
    } catch (error) {
      logger.error('❌ Error in daily alerts workflow:', error);
    }
  }

  /**
   * Calculate risks for all fields
   */
  private async calculateAllFieldRisks() {
    logger.info('Calculating risks for all fields...');

    const fields = await prisma.field.findMany({
      include: { farmerProfile: true },
    });

    logger.info(`Found ${fields.length} fields to process`);

    const forecastDays = 15;
    let processed = 0;

    for (const field of fields) {
      try {
        for (let day = 1; day <= forecastDays; day++) {
          const forecastDate = new Date();
          forecastDate.setDate(forecastDate.getDate() + day);

          const risk = await riskEngine.calculateFieldRisk(field.id, forecastDate);
          await riskEngine.saveRiskScore(field.id, forecastDate, risk);

          // Generate AI analysis for high-risk cases
          if (risk.riskLevel === 'HIGH' || risk.riskLevel === 'CRITICAL') {
            const analysis = await geminiService.generateRiskAnalysis({
              fieldId: field.id,
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

            // Update risk score with AI analysis
            await prisma.riskScore.update({
              where: {
                fieldId_forecastDate: {
                  fieldId: field.id,
                  forecastDate,
                },
              },
              data: {
                geminiSummary: analysis.summary,
                recommendations: analysis.recommendations,
              },
            });
          }
        }

        processed++;
        if (processed % 10 === 0) {
          logger.info(`Processed ${processed}/${fields.length} fields`);
        }
      } catch (error) {
        logger.error(`Error processing field ${field.id}:`, error);
      }
    }

    logger.info(`✅ Risk calculation complete: ${processed} fields processed`);
  }

  /**
   * Generate alerts based on risk scores
   */
  private async generateRiskAlerts() {
    logger.info('Generating risk-based alerts...');

    // Find high-risk scores from the next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const highRiskScores = await prisma.riskScore.findMany({
      where: {
        forecastDate: {
          gte: new Date(),
          lte: sevenDaysFromNow,
        },
        riskLevel: {
          in: ['HIGH', 'CRITICAL'],
        },
      },
      include: {
        field: {
          include: {
            farmerProfile: true,
          },
        },
      },
    });

    logger.info(`Found ${highRiskScores.length} high-risk scenarios`);

    for (const riskScore of highRiskScores) {
      try {
        // Check if alert already exists
        const existingAlert = await prisma.alert.findFirst({
          where: {
            farmerProfileId: riskScore.field.farmerProfile.id,
            alertType: 'CROP_STRESS',
            validFrom: {
              lte: riskScore.forecastDate,
            },
            validUntil: {
              gte: riskScore.forecastDate,
            },
          },
        });

        if (existingAlert) {
          continue; // Skip if alert already exists
        }

        // Create alert
        await prisma.alert.create({
          data: {
            farmerProfileId: riskScore.field.farmerProfile.id,
            alertType: 'CROP_STRESS',
            severity: riskScore.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
            title: `${riskScore.riskLevel} Risk Alert for ${riskScore.field.currentCrop || 'Your Crop'}`,
            message: riskScore.geminiSummary || `High risk detected for your field. Overall risk: ${riskScore.overallRisk.toFixed(0)}/100. Expected yield impact: ${riskScore.yieldImpact?.toFixed(0)}%.`,
            actionable: riskScore.recommendations || 'Please monitor your field closely and take preventive measures.',
            validFrom: riskScore.forecastDate,
            validUntil: new Date(riskScore.forecastDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
            triggered: false,
          },
        });

        logger.info(`Created risk alert for farmer ${riskScore.field.farmerProfile.farmerId}`);
      } catch (error) {
        logger.error('Error creating risk alert:', error);
      }
    }

    logger.info('✅ Risk alerts generation complete');
  }

  /**
   * Generate weather-based alerts
   */
  private async generateWeatherAlerts() {
    logger.info('Generating weather-based alerts...');

    const fields = await prisma.field.findMany({
      include: { farmerProfile: true },
      take: 100, // Process in batches
    });

    for (const field of fields) {
      try {
        const extremeEvents = await weatherService.detectExtremeEvents(field.latitude, field.longitude);

        for (const event of extremeEvents) {
          // Check if alert already exists
          const existingAlert = await prisma.alert.findFirst({
            where: {
              farmerProfileId: field.farmerProfile.id,
              alertType: 'WEATHER_EXTREME',
              validFrom: {
                lte: event.date,
              },
              validUntil: {
                gte: event.date,
              },
            },
          });

          if (existingAlert) continue;

          // Create weather alert
          await prisma.alert.create({
            data: {
              farmerProfileId: field.farmerProfile.id,
              alertType: 'WEATHER_EXTREME',
              severity: event.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
              title: `${event.type.replace('_', ' ')} Alert`,
              message: event.details,
              actionable: this.getWeatherActionable(event.type),
              validFrom: event.date,
              validUntil: new Date(event.date.getTime() + 24 * 60 * 60 * 1000), // 24 hours
              triggered: false,
            },
          });
        }
      } catch (error) {
        logger.error(`Error generating weather alerts for field ${field.id}:`, error);
      }
    }

    logger.info('✅ Weather alerts generation complete');
  }

  /**
   * Generate pest-based alerts
   */
  private async generatePestAlerts() {
    logger.info('Generating pest-based alerts...');

    const fields = await prisma.field.findMany({
      where: {
        currentCrop: {
          not: null,
        },
      },
      include: { farmerProfile: true },
      take: 100,
    });

    for (const field of fields) {
      try {
        const advisories = await pestService.getAdvisories(
          field.farmerProfile.district,
          field.farmerProfile.state,
          field.currentCrop!
        );

        const highSeverity = advisories.filter((a) => a.severity === 'high');

        if (highSeverity.length > 0) {
          // Check if alert exists
          const existingAlert = await prisma.alert.findFirst({
            where: {
              farmerProfileId: field.farmerProfile.id,
              alertType: 'PEST_DISEASE',
              validFrom: {
                lte: new Date(),
              },
              validUntil: {
                gte: new Date(),
              },
            },
          });

          if (existingAlert) continue;

          const pestList = highSeverity.map((a) => a.pestName).join(', ');

          await prisma.alert.create({
            data: {
              farmerProfileId: field.farmerProfile.id,
              alertType: 'PEST_DISEASE',
              severity: 'WARNING',
              title: `Pest Alert: ${pestList}`,
              message: `High severity pest/disease threat detected for ${field.currentCrop}. Active threats: ${pestList}.`,
              actionable: highSeverity[0].control || 'Implement integrated pest management practices.',
              validFrom: new Date(),
              validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
              triggered: false,
            },
          });
        }
      } catch (error) {
        logger.error(`Error generating pest alerts for field ${field.id}:`, error);
      }
    }

    logger.info('✅ Pest alerts generation complete');
  }

  /**
   * Send pending alerts (SMS/WhatsApp/Push)
   */
  private async sendPendingAlerts() {
    logger.info('Sending pending alerts...');

    const pendingAlerts = await prisma.alert.findMany({
      where: {
        triggered: false,
        validFrom: {
          lte: new Date(),
        },
      },
      include: {
        farmerProfile: {
          include: {
            user: true,
          },
        },
      },
      take: 100,
    });

    logger.info(`Found ${pendingAlerts.length} pending alerts to send`);

    for (const alert of pendingAlerts) {
      try {
        // In production, implement actual SMS/WhatsApp/Push notification services
        // For now, just mark as sent

        await prisma.alert.update({
          where: { id: alert.id },
          data: {
            triggered: true,
            sentAt: new Date(),
            smsSent: true, // Would be true after actual SMS sent
            whatsappSent: false,
            pushSent: false,
          },
        });

        logger.info(`Alert sent to farmer ${alert.farmerProfile.farmerId}: ${alert.title}`);
      } catch (error) {
        logger.error(`Error sending alert ${alert.id}:`, error);
      }
    }

    logger.info('✅ Alerts sending complete');
  }

  /**
   * Get actionable recommendations for weather events
   */
  private getWeatherActionable(eventType: string): string {
    const actionables: Record<string, string> = {
      HEATWAVE:
        'Increase irrigation frequency. Provide shade if possible. Monitor crop stress. Harvest mature crops early if possible.',
      HEAVY_RAINFALL:
        'Ensure proper drainage. Avoid field operations. Check for waterlogging. Watch for disease outbreaks.',
      FROST:
        'Cover sensitive crops. Use frost protection methods. Delay irrigation. Harvest mature crops immediately.',
      HEAT_STRESS:
        'Irrigate during cooler hours. Mulch to conserve moisture. Monitor crop health closely.',
    };

    return actionables[eventType] || 'Monitor weather conditions and take appropriate action.';
  }

  /**
   * Run manually (for testing)
   */
  async runManually() {
    logger.info('Running alerts engine manually...');
    await this.runDailyAlerts();
  }
}

export const alertsEngine = new AlertsEngine();

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  dotenv.config();
  alertsEngine.runManually().then(() => {
    logger.info('Manual run complete');
    process.exit(0);
  });
}
