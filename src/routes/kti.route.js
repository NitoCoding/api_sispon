import express from 'express';
const router = express.Router();
import { body } from 'express-validator';
import { KtiController } from '../controllers/kti.controller.js';
import {authenticate, checkPermission} from '../middleware/auth.middleware.js';

// Apply authentication middleware to all routes
// router.use(authenticate);

router.get('/', authenticate, checkPermission("KTI-VIEW"), KtiController.getAllKti);
router.get('/:id', authenticate, checkPermission("KTI-VIEW"), KtiController.getKtiById);
router.post('/', authenticate, checkPermission("KTI-CREATE"), KtiController.batchCreateKti);
router.put('/', authenticate, checkPermission("KTI-UPDATE"), KtiController.updateKti);
router.delete('/:id', authenticate, checkPermission("KTI-DELETE"), KtiController.deleteKti);
// // Get all kelas
// router.get('/', KelasController.getAllKelas);

// // Get a single kelas by ID
// router.get('/:id', KelasController.getKelasById);

// // Update a kelas
// router.put('/:id', KelasController.updateKelas);

// // Delete a kelas
// router.delete('/:id', KelasController.deleteKelas);

export default router;