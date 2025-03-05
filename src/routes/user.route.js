import express from 'express';

const router = express.Router();

import { createUser, 
    deleteUser, 
    getAllUsers, 
    getUserById, 
    migrateUsers, 
    updateUser } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

router.get('/', authenticate, getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

router.get('/sync', migrateUsers);

export default router;