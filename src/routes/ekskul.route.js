import express from 'express';
const router = express.Router();
import {authenticate, checkPermission} from '../middleware/auth.middleware.js';
import {EkskulController} from "../controllers/ekskul.controller.js";

router.get('/', authenticate, checkPermission("EKSKUL-VIEW"), EkskulController.getAllEkskul);
router.get('/:id', authenticate, checkPermission("EKSKUL-VIEW"), EkskulController.getEkskulById);
router.post('/', authenticate, checkPermission("EKSKUL-CREATE"), EkskulController.createEkskul);
router.put('/:id', authenticate, checkPermission("EKSKUL-UPDATE"), EkskulController.updateEkskul);
router.delete('/:id', authenticate, checkPermission("EKSKUL-DELETE"), EkskulController.deleteEkskul);

export default router;
