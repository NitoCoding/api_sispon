import express from "express";

const router = express.Router();

import { TaController } from "../controllers/tahun_ajaran.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all tahun ajaran
router.get('/', TaController.getAllTahunAjaran);

// Get tahun ajaran by ID
router.get('/:id', TaController.getTahunAjaranById);

// Create new tahun ajaran
router.post('/', TaController.createTahunAjaran);

// Update tahun ajaran
router.put('/:id', TaController.updateTahunAjaran);

// Delete tahun ajaran
router.delete('/:id', TaController.deleteTahunAjaran);

export default router;