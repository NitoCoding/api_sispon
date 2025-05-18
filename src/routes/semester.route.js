import express from 'express';
const router = express.Router();
import { SemesterController } from '../controllers/semester.controller.js';
import {authenticate, checkPermission} from '../middleware/auth.middleware.js';

router.get('/active', authenticate, SemesterController.getActiveSemester);
router.get('/sync', authenticate, SemesterController.migrateSemester);
router.put('/active/:id', authenticate, SemesterController.setActiveSemester);

router.post('/', authenticate, checkPermission("SEMESTER-CREATE"), SemesterController.createSemester);
router.get('/', authenticate, checkPermission("SEMESTER-VIEW"), SemesterController.getAllSemesters);
router.get('/:id', authenticate, checkPermission("SEMESTER-VIEW"), SemesterController.getSemesterById);
router.put('/:id', authenticate, checkPermission("SEMESTER-UPDATE"), SemesterController.updateSemester);
router.delete('/:id', authenticate, checkPermission("SEMESTER-DELETE"), SemesterController.deleteSemester);

export default router;