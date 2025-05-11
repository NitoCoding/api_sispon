import express from 'express';
const router = express.Router();
import { KurikulumController } from '../controllers/kurikulum.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { MapelController } from '../controllers/mapel.controller.js';
import { KompetensiController } from '../controllers/kompetensi.controller.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new kurikulum
router.post('/' ,KurikulumController.createKurikulum);

// Get all kurikulum
router.get('/', KurikulumController.getAllKurikulum);

// Get a single kurikulum by ID
router.get('/:id', KurikulumController.getKurikulumById);

// Update a kurikulum
router.put('/:id', KurikulumController.updateKurikulum);

// Delete a kurikulum
router.delete('/:id', KurikulumController.deleteKurikulum);

router.get('/:id_kurikulum/mapel', MapelController.getAllMapel)

router.get('/:id_kurikulum/mapel/:id', MapelController.getMapelById)

router.post('/:id_kurikulum/mapel', MapelController.createMapel)

router.put('/:id_kurikulum/mapel/:id', MapelController.updateMapel)

router.delete('/:id_kurikulum/mapel/:id', MapelController.deleteMapel)

router.get('/:id_kurikulum/cpl', KompetensiController.getAllKompetensiIntiByKurikulum)

export default router;