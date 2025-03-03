import express from 'express';

const router = express.Router();

import { createUser, 
    deleteUser, 
    getAllUsers, 
    getUserById, 
    migrateUsers, 
    updateUser } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

router.get('/users', authenticate, getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/sync', migrateUsers);

export default router;