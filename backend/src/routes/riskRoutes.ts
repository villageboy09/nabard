import express from 'express';
import { riskController } from '../controllers/riskController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/field/:fieldId/calculate', riskController.calculateFieldRisk.bind(riskController));
router.get('/field/:fieldId', riskController.getFieldRiskScores.bind(riskController));
router.get('/farmer/:farmerId', riskController.getFarmerRisks.bind(riskController));
router.get('/dashboard', riskController.getDashboard.bind(riskController));
router.post('/calculate-all', riskController.calculateAllRisks.bind(riskController));

export default router;
