import express from 'express';
import dotenv from 'dotenv';
import apiRouter from '../src/server/apiRouter';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount the API Router for both /api prefix and root to guarantee Vercel path preservation
app.use('/api', apiRouter);
app.use(apiRouter);

// Fallback to guarantee unmatched API routes return JSON 404 rather than HTML
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    service: 'pagecraft-editorial-api',
  });
});

// Express global error handler to guarantee unhandled errors return JSON 500
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Vercel Serverless Function Error]:', err);
  res.status(500).json({
    success: false,
    error: err?.message || 'Internal server error occurred.',
    service: 'pagecraft-editorial-api',
  });
});

// Export Express app as Vercel serverless function
export default app;

