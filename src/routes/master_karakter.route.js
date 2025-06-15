import express from 'express';

const router = express.Router();

import { MasterKarakterController } from '../controllers/master_karakter.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { createKategoriKarakterValidation,updateKategoriKarakterValidation,createKriteriaKarakterValidation, updateKriteriaKarakterValidation } from '../validators/master_kategori.validator.js';
import { paramValidation } from '../validators/param.validator.js';


router.use(authenticate);
router.get('/kategori', MasterKarakterController.getKategoriKarakter);
router.get('/kategori/:id', paramValidation,MasterKarakterController.getKategoriKarakterById);
router.post('/kategori', createKategoriKarakterValidation, MasterKarakterController.createKategoriKarakter);
router.put('/kategori/:id', updateKategoriKarakterValidation,MasterKarakterController.updateKategoriKarakter);
router.delete('/kategori/:id', paramValidation,MasterKarakterController.deleteKategoriKarakter);
router.get('/', MasterKarakterController.getKriteriaKarakter);
router.post('/', createKriteriaKarakterValidation, MasterKarakterController.createKriteriaKarakter);
router.put('/:id',updateKriteriaKarakterValidation, MasterKarakterController.updateKriteriaKarakter);
router.delete('/:id', paramValidation, MasterKarakterController.deleteKriteriaKarakter);

router.get('/kategori-dan-kriteria', MasterKarakterController.getKategoriKarakterdanKriteria);
router.get('/kategori-dan-kriteria/:id', MasterKarakterController.getKategoriKarakterdanKriteriaById);
router.post('/kategori-dan-kriteria', MasterKarakterController.createKategoriKarakterdanKriteria);
router.put('/kategori-dan-kriteria/:id', MasterKarakterController.updateKategoriKarakterdanKriteria);



export default router;