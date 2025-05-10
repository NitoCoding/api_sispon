import express from 'express';
const router = express.Router();
import {authenticate, checkPermission} from '../middleware/auth.middleware.js';
import {EkskulController} from "../controllers/ekskul.controller.js";
import {EkskulSantriController} from "../controllers/ekskul_santri.controller.js";

router.get('/', authenticate, checkPermission("EKSKUL-SANTRI-VIEW"), EkskulSantriController.getAllEkskulSantri);
router.get('/:id', authenticate, checkPermission("EKSKUL-SANTRI-VIEW"), EkskulSantriController.getEkskulSantriById);
router.post('/', authenticate, checkPermission("EKSKUL-SANTRI-CREATE"), EkskulSantriController.createEkskulSantri);
router.put('/', authenticate, checkPermission("EKSKUL-SANTRI-UPDATE"), EkskulController.updateEkskul);
router.delete('/:id', authenticate, checkPermission("EKSKUL-SANTRI-DELETE"), EkskulSantriController.deleteEkskulSantri);

export default router;