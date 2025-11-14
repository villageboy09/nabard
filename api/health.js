// Health check endpoint
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Agricultural Risk Mitigation API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
}
