import express from 'express';
const router = express.Router();
import { KelasController } from '../controllers/kelas.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new kelas
router.post('/', KelasController.createKelas);

// Get all kelas
router.get('/', KelasController.getAllKelas);

// Get a single kelas by ID
router.get('/:id', KelasController.getKelasById);

// Update a kelas
router.put('/:id', KelasController.updateKelas);

// Delete a kelas
router.delete('/:id', KelasController.deleteKelas);

export default router;