import express from 'express';
const router = express.Router();
import { createKelas, getAllKelas, getKelasById, updateKelas, deleteKelas } from '../controllers/kelas.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new kelas
router.post('/', createKelas);

// Get all kelas
router.get('/', getAllKelas);

// Get a single kelas by ID
router.get('/:id', getKelasById);

// Update a kelas
router.put('/:id', updateKelas);

// Delete a kelas
router.delete('/:id', deleteKelas);

export default router;