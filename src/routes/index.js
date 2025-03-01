import express from 'express';

const router = express.Router();

// Import route modules
import authRoutes from './auth.js';
import userRoutes from './user.js';

// Register routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;