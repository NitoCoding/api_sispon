import express from 'express';
const router = express.Router();
import { SemesterController } from '../controllers/semester.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

router.get('/active', authenticate, SemesterController.getActiveSemester);
router.get('/sync', authenticate, SemesterController.migrateSemester);
router.put('/active/:id', authenticate, SemesterController.setActiveSemester);

router.post('/', authenticate, SemesterController.createSemester);
router.get('/', authenticate, SemesterController.getAllSemesters);
router.get('/:id', authenticate, SemesterController.getSemesterById);
router.put('/:id', authenticate, SemesterController.updateSemester);
router.delete('/:id', authenticate, SemesterController.deleteSemester);

export default router;