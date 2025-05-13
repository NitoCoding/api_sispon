import express from 'express';
import { byrSantriController } from '../controllers/tagihan_santri.controller.js';


const router = express.Router();

router.get('/', byrSantriController.getJenisTagihan)

export default router;