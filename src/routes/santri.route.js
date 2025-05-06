import express from 'express';

const router = express.Router();

import {
    createSantri, createSantriMassal, deleteSantri,
    getAllSantri, getAlumni,
    getSantriById,
    migrateSantri,
    updateSantri
} from "../controllers/santri.controller.js";
import {upload} from "../middleware/upload.middleware.js";
import {authenticate, checkPermission} from "../middleware/auth.middleware.js";

router.get('/sync', authenticate, migrateSantri);
router.post("/mass-input", authenticate, upload.single("file"), createSantriMassal);
router.get('/alumni/:id_tahun_ajaran', authenticate, getAlumni)

router.post('/', authenticate, checkPermission("SANTRI-CREATE"), upload.single("foto"), createSantri);
router.get('/', authenticate, checkPermission("SANTRI-VIEW"), getAllSantri);
router.get('/:id', authenticate, checkPermission("SANTRI-VIEW"), getSantriById);
router.put('/:id', authenticate, checkPermission("SANTRI-UPDATE"), upload.single("foto"), updateSantri);
router.delete('/:id', authenticate, checkPermission("SANTRI-DELETE"), deleteSantri);

export default router;