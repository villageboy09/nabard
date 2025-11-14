import express from 'express';
import { fieldController } from '../controllers/fieldController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', fieldController.getFields.bind(fieldController));
router.post('/', fieldController.createField.bind(fieldController));
router.get('/:fieldId', fieldController.getFieldDetails.bind(fieldController));
router.patch('/:fieldId', fieldController.updateField.bind(fieldController));
router.get('/:fieldId/weather', fieldController.getWeatherForecast.bind(fieldController));
router.get('/:fieldId/satellite', fieldController.getSatelliteData.bind(fieldController));

export default router;
