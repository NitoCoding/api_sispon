import express from 'express';

const router = express.Router();

import {authenticate, checkPermission} from '../middleware/auth.middleware.js';
import {PrestasiPelanggaranController} from "../controllers/prestasi_pelanggaran.controller.js";
import {upload} from "../middleware/upload.middleware.js";

router.post('/', authenticate, checkPermission("CREATE-PRESTASI-PELANGGARAN"), upload.array("files", 5), PrestasiPelanggaranController.createPrestasiPelanggaran);
router.get('/', authenticate, checkPermission("VIEW-PRESTASI-PELANGGARAN"), PrestasiPelanggaranController.getAllPrestasiPelanggaran);
router.get('/:id', authenticate, checkPermission("VIEW-PRESTASI-PELANGGARAN"), PrestasiPelanggaranController.getPrestasiPelanggaranById);
router.put('/:id', authenticate, checkPermission("UPDATE-PRESTASI-PELANGGARAN"), PrestasiPelanggaranController.updatePrestasiPelanggaran);
router.delete('/:id', authenticate, checkPermission("DELETE-PRESTASI-PELANGGARAN"), PrestasiPelanggaranController.deletePrestasiPelanggaran);


export default router;