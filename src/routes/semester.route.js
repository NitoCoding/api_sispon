import express from 'express';
const router = express.Router();
import { SemesterController } from '../controllers/semester.controller.js';
import {authenticate, checkPermission} from '../middleware/auth.middleware.js';

router.get('/active', authenticate, SemesterController.getActiveSemester);
router.get('/sync', authenticate, SemesterController.migrateSemester);
router.put('/active/:id', authenticate, SemesterController.setActiveSemester);
router.get('/show-used-semester', authenticate, SemesterController.getUserUsedSemester);

router.post('/', authenticate, checkPermission("SEMESTER"), SemesterController.createSemester);
router.get('/', authenticate, checkPermission("SEMESTER"), SemesterController.getAllSemesters);
router.get('/:id', authenticate, checkPermission("SEMESTER"), SemesterController.getSemesterById);
router.put('/:id', authenticate, checkPermission("SEMESTER"), SemesterController.updateSemester);
router.delete('/:id', authenticate, checkPermission("SEMESTER"), SemesterController.deleteSemester);

export default router;