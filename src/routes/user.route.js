import express from 'express';

const router = express.Router();

import {
    createUser,
    deleteUser, fillRole,
    getAllUsers,
    getUserById, getUserRoles,
    migrateUsers,
    updateUser
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

router.get('/fill-role', fillRole);
router.get('/user-role', authenticate, getUserRoles)

router.get('/', authenticate, getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

router.get('/sync', migrateUsers);

export default router;