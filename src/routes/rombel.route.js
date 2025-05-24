import express from 'express';


const router = express.Router();

import { authenticate } from '../middleware/auth.middleware.js';
import {
    createRombel,
    deleteRombel,
    getAllRombel, getAllWaliKelasRombel,
    getRombelById,
    updateRombel, updateWaliKelas
} from "../controllers/rombel.controller.js";
import {upload} from "../middleware/upload.middleware.js";

router.put('/wali-kelas', authenticate, upload.single("foto_ttd"), updateWaliKelas);
router.get('/wali-kelas', authenticate, getAllWaliKelasRombel);

router.post('/', authenticate, createRombel);
router.get('/', authenticate, getAllRombel);
router.get('/:id', authenticate, getRombelById);
router.put('/:id', authenticate, updateRombel);
router.delete('/:id', authenticate, deleteRombel);


export default router;