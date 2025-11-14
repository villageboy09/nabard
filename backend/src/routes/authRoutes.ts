import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));
router.get('/me', authenticateToken, authController.me.bind(authController));

export default router;
