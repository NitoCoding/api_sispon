import express from 'express';
const router = express.Router();
import { KurikulumController } from '../controllers/kurikulum.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { MapelController } from '../controllers/mapel.controller.js';
import { KompetensiController } from '../controllers/kompetensi.controller.js';

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

router.get('/:id_kurikulum/cpl', KompetensiController.getAllKompetensiIntiByKurikulum)

router.get('/:id_kurikulum/cpl/:id/detail', KompetensiController.getKompetensiIntiById)

router.post('/:id_kurikulum/cpl', KompetensiController.createKompetensiInti)

router.put('/:id_kurikulum/cpl/:id', KompetensiController.updateKompetensiInti)

router.delete('/:id_kurikulum/cpl/:id', KompetensiController.deleteKompetensiInti)

router.get('/:id_kurikulum/mapel/:id_mapel/cpmk', KompetensiController.getAllKompetensiDasarByMapel)

router.post('/:id_kurikulum/mapel/:id_mapel/cpmk', KompetensiController.createKompetensiDasar)

router.put('/:id_kurikulum/mapel/:id_mapel/cpmk/:id', KompetensiController.updateKompetensiDasar)

export default router;