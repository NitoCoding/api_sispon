import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Validation middleware
const updateUserValidation = [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail()
];

// User routes - All routes require authentication
router.use(authenticate);

router.get('/profile', (req, res, next) => {
  try {
    // Return the user profile from the authenticated request
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', updateUserValidation, (req, res, next) => {
  try {
    // TODO: Implement update user profile logic
    // For now, just throw a not implemented error
    throw new AppError('Not implemented yet', 501);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    // TODO: Implement get user by id logic
    // For now, just throw a not implemented error
    throw new AppError('Not implemented yet', 501);
  } catch (error) {
    next(error);
  }
});

export default router;