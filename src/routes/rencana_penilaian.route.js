import express from 'express';
import {authenticate} from "../middleware/auth.middleware.js";
import {RencanaPenilaianController} from "../controllers/rencana_penilaian.controller.js";
const router = express.Router();

router.post('/', authenticate, RencanaPenilaianController.createRencanaPenilaian);
router.put('/:id', authenticate, RencanaPenilaianController.updateRencanaPenilaian);

export default router;