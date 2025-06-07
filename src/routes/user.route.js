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

router.get('/:kode-pegawai/roles', UserController.getRoleByKodePegawai);

router.get('/', authenticate, UserController.getAllUsers);
router.get('/:id', UserController.getUserById);
router.post('/', UserController.createUser);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

router.get('/sync', UserController.migrateUsers);

export default router;