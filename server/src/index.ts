import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDB } from './db';
import authRoutes from './routes/auth';
import entityRoutes from './routes/entities';
import settingsRoutes from './routes/settings';
import adminRoutes from './routes/admin';
import organizationRoutes from './routes/organization';
import helmet from 'helmet';
import path from 'path';
import { maintenanceMiddleware } from './middleware/maintenance';
import { authMiddleware } from './middleware/auth';
import { rateLimit } from 'express-rate-limit';
import slowDown from 'express-slow-down';
import hpp from 'hpp';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
})); // Enhanced Security Headers

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Aumentar o limite do parser apenas para rotas de entidades e sincronização pesada
app.use('/api/entities', express.json({ limit: '15mb' }));

// Limite estrito global para as demais chamadas da API prevenindo DoS (1mb)
app.use(express.json({ limit: '1mb' }));
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(morgan('dev'));
app.disable('x-powered-by');

// Slow Down - Delays requests after a threshold to deter brute force
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // allow 100 requests per 15 minutes
  delayMs: (hits) => hits * 100, // add 100ms delay per request above threshold
});
app.use(speedLimiter);

// Rate Limiting - Hard limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // Limit each IP to 200 requests per 15 mins
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Database
initDB();

// Routes
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h1>Pure Dev Dashboard - Backend API</h1>
      <p>O servidor está rodando corretamente!</p>
      <p>Para acessar a interface do Dashboard, acesse: <a href="http://localhost:8080">http://localhost:8080</a></p>
      <hr/>
      <p style="color: #666;">Endpoints: /api/auth, /api/entities, /health</p>
    </div>
  `);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global API Cache-Control (prevent browser GET caching)
app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Configure base API routes
app.use('/api/auth', authRoutes);

// Apply auth for all following routes
app.use(authMiddleware as any);

// Apply maintenance mode check for general users
app.use(maintenanceMiddleware as any);

app.use('/api/entities', entityRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/org', organizationRoutes);

// --- SERVING STATIC FRONTEND FROM ROOT DIST ---
const distPath = path.join(__dirname, '..', '..', 'dist');

// Serve static files from the build directory
app.use(express.static(distPath));

// For SPA routing: serve index.html for any non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Erro interno no servidor' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
