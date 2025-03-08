import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './config/logger.js';

const app = express();

// Security Middleware
app.use(helmet()); // Helps secure Express apps with various HTTP headers
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(compression()); // Compress response bodies

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Request logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body parsing
app.use(express.json({ limit: '10kb' })); // Body limit is 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API Routes
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import guru_pegawaiRoutes from "./routes/guru_pegawai.route.js";
import santriRoutes from "./routes/santri.route.js";

// Register API routes
// app.use('/api');

app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/guru-pegawais', guru_pegawaiRoutes);
app.use('/santris', santriRoutes);

// Error handling
app.use(errorHandler);

// Handle unhandled routes
app.use('*', (req, res) => {  
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

export default app;