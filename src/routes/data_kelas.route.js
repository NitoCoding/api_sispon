import express from 'express';
const router = express.Router();

import {DataKelasController} from "../controllers/data_kelas.controller.js";
import {authenticate, checkPermission} from "../middleware/auth.middleware.js";

router.post('/', authenticate, checkPermission("DATA-KELAS-CREATE"), DataKelasController.createDataKelas);
router.get('/', authenticate, checkPermission("DATA-KELAS-VIEW"), DataKelasController.getAllDataKelas);
router.get('/:id', authenticate, checkPermission("DATA-KELAS-VIEW"), DataKelasController.getDataKelasById);
router.put('/:id', authenticate, checkPermission("DATA-KELAS-UPDATE"), DataKelasController.updateDataKelas);
router.delete('/:id', authenticate, checkPermission("DATA-KELAS-DELETE"), DataKelasController.deleteDataKelas);

export default router;