import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './server/db.ts';
import { seedDatabase } from './server/seed.ts';
import { publicEventsRouter } from './server/routes/publicEvents.ts';
import { registrationsRouter } from './server/routes/registrations.ts';
import { adminAuthRouter } from './server/routes/adminAuth.ts';
import { adminEventsRouter } from './server/routes/adminEvents.ts';
import { adminRegistrationsRouter } from './server/routes/adminRegistrations.ts';
import { errorHandler } from './server/middleware/errorHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Core Middlewares
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging for API
app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API ${req.method}] ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api/events', registrationsRouter);
app.use('/api/events', publicEventsRouter);
app.use('/api/registrations', registrationsRouter);
app.use('/api/auth', adminAuthRouter);
app.use('/api/admin/events', adminEventsRouter);
app.use('/api/admin/registrations', adminRegistrationsRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'EVENTFLOW API',
  });
});

// API Centralized Error Handler (must be mounted before Vite frontend handling)
app.use(errorHandler);

async function startServer() {
  try {
    // 1. Connect to Database & Seed Initial Data
    try {
      await connectDB();
      await seedDatabase();
    } catch (dbErr) {
      console.warn('[Server] Database initialization warning, proceeding with startup:', dbErr);
    }

    // 2. Setup Vite Middlewares in Development or Static Server in Production
    if (!isProd) {
      console.log('[Server] Initializing Vite development middleware...');
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      console.log('[Server] Serving production build from dist...');
      const distPath = path.resolve(__dirname, 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    // 3. Listen on configured port
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`[Server] EVENTFLOW server running at http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
}

startServer();
