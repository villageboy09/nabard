import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler.js';
import { logger } from './utils/logger.js';
import riskRoutes from './routes/riskRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import fieldRoutes from './routes/fieldRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/risks', riskRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/fields', fieldRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Agricultural Risk Mitigation API',
    version: '1.0.0',
    description: 'Track 2 - Risk Mitigation & Early Warning System',
    endpoints: {
      risks: '/api/risks',
      alerts: '/api/alerts',
      fields: '/api/fields',
      health: '/health',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌍 API available at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
