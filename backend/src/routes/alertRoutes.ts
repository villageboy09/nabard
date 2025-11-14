import express from 'express';
import { alertController } from '../controllers/alertController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', alertController.getAlerts.bind(alertController));
router.patch('/:alertId/read', alertController.markAsRead.bind(alertController));
router.get('/stats', alertController.getAlertStats.bind(alertController));

export default router;
