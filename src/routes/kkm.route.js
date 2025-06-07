import express from 'express';
import {authenticate} from "../middleware/auth.middleware.js";
import {KkmDetailController} from "../controllers/kkm.controller.js";
const router = express.Router();

router.get('/', authenticate, KkmDetailController.getAllKkmDetail);
router.post('/', authenticate, KkmDetailController.createKkmDetail);

export default router;