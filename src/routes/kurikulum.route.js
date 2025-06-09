import express from 'express';
const router = express.Router();
import { KurikulumController } from '../controllers/kurikulum.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { MapelController } from '../controllers/mapel.controller.js';

// Apply authentication middleware to all routes
router.use(authenticate);

router.get('/all-detail', KurikulumController.getAllDetailKurikulum);
router.get('/mapel-detail/:id_mapel', KurikulumController.getDetailMapel);

// Create a new kurikulum
router.post('/', KurikulumController.createKurikulum);
router.get('/', KurikulumController.getAllKurikulum);
router.get('/:id', KurikulumController.getKurikulumById);
router.put('/:id', KurikulumController.updateKurikulum);
router.delete('/:id', KurikulumController.deleteKurikulum);

router.get('/:idkur/mapel', MapelController.getAllMapel)
router.get('/:idkur/mapel/:id', MapelController.getMapelById)
router.post('/:idkur/mapel', MapelController.createMapel)
router.put('/:idkur/mapel/:id', MapelController.updateMapel)
router.delete('/:idkur/mapel/:id', MapelController.deleteMapel)

export default router;