import express from 'express';
import dotenv from 'dotenv';
import apiRouter from '../src/server/apiRouter';

dotenv.config();

const app = express();
app.use(express.json());

// Mount the API Router for both /api prefix and root to guarantee Vercel path preservation
app.use('/api', apiRouter);
app.use(apiRouter);

// Fallback to guarantee API routes return JSON 404 rather than falling through
app.use((_req, res) => {
  res.status(404).json({ error: 'API endpoint not found', service: 'pagecraft-editorial-api' });
});

// Export Express app as Vercel serverless function
export default app;

