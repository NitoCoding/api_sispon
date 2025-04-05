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
import {authenticate} from "../middleware/auth.middleware.js";

router.get('/sync', authenticate, migrateSantri);
router.post("/mass-input", authenticate, upload.single("file"), createSantriMassal);
router.get('/alumni/:id_tahun_ajaran', authenticate, getAlumni)

router.post('/', authenticate, upload.single("foto"), createSantri);
router.get('/', authenticate, getAllSantri);
router.get('/:id', authenticate, getSantriById);
router.put('/:id', authenticate, upload.single("foto"), updateSantri);
router.delete('/:id', authenticate, deleteSantri);

export default router;