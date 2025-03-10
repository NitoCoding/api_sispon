import express from 'express';
const router = express.Router();
import {
  RombelController
} from '../controllers/rombel.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

// Rombel routes
router.use(authenticate);
router.post('/', RombelController.createRombel);
router.get('/', RombelController.getRombels);
router.get('/:id', RombelController.getRombelById);
router.put('/:id', RombelController.updateRombel);
router.delete('/:id', RombelController.deleteRombel);

// Rombel member routes
router.post('/anggota', RombelController.addStudentToRombel);
router.delete('/anggota/:id', RombelController.removeStudentFromRombel);

export default router;