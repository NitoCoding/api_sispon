import express from 'express';
import { DataTagihanSantriController } from '../controllers/data_tagihan_santri.controller.js';
// import { tagihanSantriController } from '../controllers/tagihan_santri.controller.js';


const router = express.Router();

// router.use('tagihan_santri', router)

router.get('/:id_santri', DataTagihanSantriController.getDataTagihanSantri)
// router.post('/', )

export default router;