import express from 'express';
import { body } from 'express-validator';
import { login, register, logout } from '../controllers/auth.controller.js';

const router = express.Router();

// Validation middleware
const loginValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

// Auth routes
router.post('/login', loginValidation, login);
router.post('/register', registerValidation, register);
router.post('/logout', logout);

export default router;