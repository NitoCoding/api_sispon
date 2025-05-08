import express from 'express';

const router = express.Router();


import { authenticate, checkPermission } from '../middleware/auth.middleware.js';
import { upload } from "../middleware/upload.middleware.js";
import { PegawaiController } from '../controllers/guru_pegawai.controller.js';

router.get('/sync',PegawaiController.migrateGuruPegawai);
router.get('/details', authenticate, checkPermission('PEGAWAI-VIEW') ,PegawaiController.getGuruPegawaiDetails);
router.put('/details', authenticate, checkPermission('PEGAWAI-UPDATE'),upload.single("foto"), PegawaiController.updateGuruPegawaiDetails);

router.post('/', authenticate, checkPermission('PEGAWAI-CREATE') ,upload.single("foto"), PegawaiController.createGuruPegawai);
router.get('/', authenticate, checkPermission('PEGAWAI-VIEW'),PegawaiController.getAllGuruPegawai);
router.get('/:id', authenticate, checkPermission('PEGAWAI-VIEW'),PegawaiController.getGuruPegawaiById);
router.put('/:id', authenticate,checkPermission('PEGAWAI-UPDATE'), upload.single("foto"), PegawaiController.updateGuruPegawai);
router.delete('/:id', authenticate, checkPermission('PEGAWAI-DELETE') ,PegawaiController.deleteGuruPegawai);

export default router;