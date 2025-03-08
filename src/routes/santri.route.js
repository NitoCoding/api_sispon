import express from 'express';

const router = express.Router();

import { authenticate } from '../middleware/auth.middleware.js';
import {
    createSantri, deleteSantri,
    getAllSantri,
    getSantriById,
    migrateSantri,
    updateSantri
} from "../controllers/santri.controller.js";

router.get('/sync', migrateSantri);

router.post('/', authenticate, createSantri);
router.get('/', authenticate, getAllSantri);
router.get('/:id', authenticate, getSantriById);
router.put('/:id', authenticate, updateSantri);
router.delete('/:id', authenticate, deleteSantri);

export default router;