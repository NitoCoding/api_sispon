import express from 'express';

const router = express.Router();

import { authenticate } from '../middleware/auth.middleware.js';
import {
    createRombel,
    deleteRombel,
    getAllRombel,
    getRombelById,
    updateRombel
} from "../controllers/rombel.controller.js";

router.post('/', authenticate, createRombel);
router.get('/', authenticate, getAllRombel);
router.get('/:id', authenticate, getRombelById);
router.put('/:id', authenticate, updateRombel);
router.delete('/:id', authenticate, deleteRombel);

export default router;