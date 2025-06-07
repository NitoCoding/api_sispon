import express from 'express';
const router = express.Router();

import { RombelKelasController } from "../controllers/rombel_kelas.controller.js";
import {authenticate, checkPermission} from '../middleware/auth.middleware.js';

router.put('/copy-config', authenticate, checkPermission("ROMBEL-KELAS-CREATE"), RombelKelasController.copyConfig);
router.get('/rombel-detail/:id', authenticate, checkPermission("ROMBEL-KELAS-VIEW"), RombelKelasController.getRombelDetail);
router.get('/kelas-detail/:id', authenticate, checkPermission("ROMBEL-KELAS-VIEW"), RombelKelasController.getKelasDetail);

router.post('/', authenticate, checkPermission("ROMBEL-KELAS-CREATE"), RombelKelasController.createRombelKelas);
router.get('/', authenticate, checkPermission("ROMBEL-KELAS-VIEW"), RombelKelasController.getAllRombelKelas);
// router.get('/:id', authenticate, checkPermission("ROMBEL-KELAS-VIEW"), RombelKelasController.getRombelKelasById);
// router.put('/:id', authenticate, checkPermission("ROMBEL-KELAS-UPDATE"), RombelKelasController.updateRombelKelas);
// router.delete('/:id', authenticate, checkPermission("ROMBEL-KELAS-DELETE"), RombelKelasController.deleteRombelKelas);

export default router;