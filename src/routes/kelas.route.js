import express from 'express';
const router = express.Router();
import { KelasController } from '../controllers/kelas.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

// Apply authentication middleware to all routes
router.use(authenticate);

router.get('/sync', KelasController.migrateKelas);

router.post('/', KelasController.createKelas);
router.get('/', KelasController.getAllKelas);
router.get('/:id', KelasController.getKelasById);
router.put('/:id', KelasController.updateKelas);
router.delete('/:id', KelasController.deleteKelas);

export default router;