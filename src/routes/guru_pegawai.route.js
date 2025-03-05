import express from 'express';

const router = express.Router();

import {
    createGuruPegawai, deleteGuruPegawai,
    getAllGuruPegawai,
    getGuruPegawaiById, migrateGuruPegawai,
    updateGuruPegawai
} from "../controllers/guru_pegawai.controller.js";
import { authenticate } from '../middleware/auth.middleware.js';

router.get('/sync', migrateGuruPegawai);

router.post('/', authenticate, createGuruPegawai);
router.get('/', authenticate, getAllGuruPegawai);
router.get('/:id', authenticate, getGuruPegawaiById);
router.put('/:id', authenticate, updateGuruPegawai);
router.delete('/:id', authenticate, deleteGuruPegawai);

export default router;