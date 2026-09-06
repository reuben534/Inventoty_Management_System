import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { connectDb } from './server/db.js';
import { apiRouter } from './server/routes.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Connect to MongoDB
  try {
    await connectDb();
    console.log('MongoDB connected and initialized successfully.');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
  }

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', stack: 'MERN', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api', apiRouter);

  // Vite middleware for development vs Static file serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MERN Inventory Management Server running on http://localhost:${PORT}`);
  });
}

startServer();
