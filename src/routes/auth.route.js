import express from 'express';
import { body } from 'express-validator';

const router = express.Router();

// Validation middleware
// const loginValidation = [
//   body('email').isEmail().normalizeEmail(),
//   body('password').isLength({ min: 6 })
// ];

const loginValidation = [
  body('name').trim().notEmpty(),
  body('password').isLength({ min: 6 })
];

// const registerValidation = [
//   body('name').trim().notEmpty(),
//   body('email').isEmail().normalizeEmail(),
//   body('password').isLength({ min: 6 })
// ];

// Auth routes
router.post('/login', loginValidation, (req, res) => {
  // TODO: Implement login logic
  res.status(501).json({ message: 'Not implemented yet' });
});

router.post('/register', registerValidation, (req, res) => {
  // TODO: Implement registration logic
  res.status(501).json({ message: 'Not implemented yet' });
});

router.post('/logout', (req, res) => {
  // TODO: Implement logout logic
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router;