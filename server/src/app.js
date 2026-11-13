import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env, isProd } from './config/env.js';
import { sanitize } from './utils/helpers.js';
import { notFound, errorHandler } from './middleware/error.js';
import auth from './routes/auth.js';
import vehicles from './routes/vehicles.js';
import inquiries from './routes/inquiries.js';
import imports from './routes/imports.js';
import quotations from './routes/quotations.js';
import { categories, auctions, testimonials, faqs, settings } from './routes/crud.js';
import { favorites, tax, calculator, notifications, uploads, gallery, admin } from './routes/misc.js';

const app = express();
app.set('trust proxy', 1);
const allowedOrigins = [
  ...(env.clientUrl || '').split(','),
  'https://car-855.vercel.app',
  'http://localhost:5173',
]
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsOptions = { origin: allowedOrigins, credentials: true };

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // use '/{*splat}' if you're on Express 5
if (!isProd) app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use((req, _res, next) => { req.body = sanitize(req.body); req.query = sanitize(req.query); req.params = sanitize(req.params); next(); });

const limiter = (max, windowMin = 15) => rateLimit({ windowMs: windowMin * 60 * 1000, max, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many requests, please try again later.' } });
app.use('/api', limiter(600));
app.use('/api/auth/login', limiter(10));
app.use('/api/auth/register', limiter(10, 60));
app.use('/api/auth/forgot-password', limiter(5, 60));

app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api/auth', auth);
app.use('/api/vehicles', vehicles);
app.use('/api/categories', categories);
app.use('/api/auctions', auctions);
app.use('/api/testimonials', testimonials);
app.use('/api/faqs', faqs);
app.use('/api/settings', settings);
app.use('/api/inquiries', limiter(30, 60), inquiries);
app.use('/api/import-requests', imports);
app.use('/api/quotations', quotations);
app.use('/api/favorites', favorites);
app.use('/api/tax-configurations', tax);
app.use('/api/calculator', calculator);
app.use('/api/notifications', notifications);
app.use('/api/uploads', uploads);
app.use('/api/gallery', gallery);
app.use('/api/admin', admin);
app.use(notFound);
app.use(errorHandler);
export default app;
