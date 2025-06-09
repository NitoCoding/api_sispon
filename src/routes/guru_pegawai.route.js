import express from 'express';

const router = express.Router();

import {
    createGuruPegawai, deleteGuruPegawai,
    getAllGuruPegawai, getAllGuruPegawaiLogin,
    getGuruPegawaiById, getGuruPegawaiDetails, getIsWaliGuruPegawai, migrateGuruPegawai,
    updateGuruPegawai, updateGuruPegawaiDetails
} from "../controllers/guru_pegawai.controller.js";
import { authenticate } from '../middleware/auth.middleware.js';
import {upload} from "../middleware/upload.middleware.js";

router.get('/login', getAllGuruPegawaiLogin);
router.get('/sync', migrateGuruPegawai);
router.get('/details', authenticate, getGuruPegawaiDetails);
router.put('/details', authenticate, upload.single("foto"), updateGuruPegawaiDetails);
router.get('/iswali', authenticate, getIsWaliGuruPegawai);

router.post('/', authenticate, upload.single("foto"), createGuruPegawai);
router.get('/', authenticate, getAllGuruPegawai);
router.get('/:id', authenticate, getGuruPegawaiById);
router.put('/:id', authenticate, upload.single("foto"), updateGuruPegawai);
router.delete('/:id', authenticate, deleteGuruPegawai);

export default router;