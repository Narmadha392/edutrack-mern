import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import enrollmentRoutes from './routes/enrollments.js';
import assignmentRoutes from './routes/assignments.js';

dotenv.config();

const app = express();

// Allow configured client plus common localhost dev ports
const allowedOrigins = new Set([
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174'
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // mobile apps, curl, etc.
      try {
        const url = new URL(origin);
        if (url.hostname === 'localhost') return callback(null, true);
      } catch (_) { /* ignore parse errors */ }
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ message: 'EduTrack API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/assignments', assignmentRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edutrack';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((e) => {
    console.error('Mongo connection error:', e.message);
    process.exit(1);
  });
