import express from 'express';

const router = express.Router();

import {
    createUser,
    deleteUser, fillRole,
    getAllUsers,
    getUserById,
    migrateUsers,
    updateUser
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

router.get('/fill-role', fillRole);

router.get('/', authenticate, getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

router.get('/sync', UserController.migrateUsers);

export default router;