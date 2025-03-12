import express from 'express';

const router = express.Router();

import {
    createSantri, deleteSantri,
    getAllSantri,
    getSantriById,
    migrateSantri,
    updateSantri
} from "../controllers/santri.controller.js";
import {upload} from "../middleware/upload.middleware.js";

router.get('/sync', migrateSantri);

router.post('/', upload.single("foto"), createSantri);
router.get('/', getAllSantri);
router.get('/:id', getSantriById);
router.put('/:id', upload.single("foto"), updateSantri);
router.delete('/:id', deleteSantri);

export default router;