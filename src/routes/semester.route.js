import express from 'express';
const router = express.Router();
import { SemesterController } from '../controllers/semester.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new semester
router.post('/', SemesterController.createSemester);

// Get all semesters
router.get('/', SemesterController.getAllSemesters);

// Get a single semester by ID
router.get('/:id', SemesterController.getSemesterById);

// Update a semester
router.put('/:id', SemesterController.updateSemester);

// Delete a semester
router.delete('/:id', SemesterController.deleteSemester);

export default router;