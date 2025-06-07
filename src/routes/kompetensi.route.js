import express from 'express';
import {authenticate} from "../middleware/auth.middleware.js";
import {KompetensiController} from "../controllers/kompetensi.controller.js";
const router = express.Router();

router.post('/ki/', authenticate, KompetensiController.createMapelKI);
router.post('/kd/', authenticate, KompetensiController.createMapelKD);

router.put('/ki/:id_kompetensi', authenticate, KompetensiController.updateMapelKI);

export default router;