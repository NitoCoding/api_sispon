import express from 'express';
import {authenticate} from "../middleware/auth.middleware.js";
import {JamPelajaranController} from "../controllers/jam_pelajaran.controller.js";
const router = express.Router();

router.get('/', authenticate, JamPelajaranController.getAllJamPelajaran);
router.get('/:id', authenticate, JamPelajaranController.getJamPelajaranById);
router.post('/', authenticate, JamPelajaranController.createJamPelajaran);
router.put('/:id', authenticate, JamPelajaranController.updateJamPelajaran);
router.delete('/:id', authenticate, JamPelajaranController.deleteJamPelajaran);

export default router;