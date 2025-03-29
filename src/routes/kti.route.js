import express from 'express';
const router = express.Router();
import { body } from 'express-validator';
import { KtiController } from '../controllers/kti.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

// Apply authentication middleware to all routes
// router.use(authenticate);

router.get('/', KtiController.getAllKti);
router.post('/', KtiController.createKti);
router.post('/batch', KtiController.batchCreateKti);
router.put('/:id', KtiController.updateKti);
router.delete('/:id', KtiController.deleteKti);
// // Get all kelas
// router.get('/', KelasController.getAllKelas);

// // Get a single kelas by ID
// router.get('/:id', KelasController.getKelasById);

// // Update a kelas
// router.put('/:id', KelasController.updateKelas);

// // Delete a kelas
// router.delete('/:id', KelasController.deleteKelas);

export default router;