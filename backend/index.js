import './env.js';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import checkReadinessRoutes from './routes/checkReadinessRoutes.js';
import documentsRoutes from './routes/documentsRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import preparationRoutes from './routes/preparationRoutes.js';
import dependencyMapRoutes from './routes/dependencyMapRoutes.js';
import requirementsDirectoryRoutes from './routes/requirementsDirectoryRoutes.js';
import addServiceRoutes from './routes/addServiceRoutes.js';
import userServicesRoutes from './routes/userServicesRoutes.js';
import idCheckRoutes from './routes/idCheckRoutes.js';
import { authenticate, optionalAuthenticate } from './middleware/authMiddleware.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');

// FRONTEND_URL may hold several comma-separated origins, e.g.
// "http://localhost:5173,https://reqcheck.example.com"
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header = curl / server-to-server; browsers always send one.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Context'],
    maxAge: 600,
  }),
);
app.use(express.json({ limit: '100kb' }));

// Auth is handled by Supabase: the browser sends "Authorization: Bearer <access token>".
app.use('/api/auth', authRoutes);

// Public (guests get the catalog; a supplied token must be valid)
app.use('/api/dashboard', optionalAuthenticate, dashboardRoutes);
app.use('/api/requirements-directory', optionalAuthenticate, requirementsDirectoryRoutes);

// Guests are allowed to read (their data arrives in X-Guest-Context) but only members can write to the database.
const memberOnlyWrites = (req, res, next) =>
  req.method === 'GET' || req.user ? next() : res.status(401).json({ error: 'Authentication required' });

app.use('/api/check-readiness', optionalAuthenticate, checkReadinessRoutes);
app.use('/api/documents', optionalAuthenticate, memberOnlyWrites, documentsRoutes);
app.use('/api/assessment', optionalAuthenticate, assessmentRoutes);
app.use('/api/preparation', optionalAuthenticate, preparationRoutes);
app.use('/api/dependency-map', optionalAuthenticate, dependencyMapRoutes);
app.use('/api/add-service', optionalAuthenticate, memberOnlyWrites, addServiceRoutes);
app.use('/api/user-services', authenticate, userServicesRoutes); // guests manage this locally in the browser
app.use('/api/id-check', optionalAuthenticate, idCheckRoutes);

app.get('/', (req, res) => res.json({ message: 'Backend is running' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => res.status(404).json({ error: `Not found: ${req.method} ${req.path}` }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 5 MB)' : 'Upload an image file';
    return res.status(400).json({ error: message });
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body too large' });
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Allowed frontend origins: ${allowedOrigins.join(', ')}`);
});
