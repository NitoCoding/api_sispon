import express from 'express';

const router = express.Router();

import { createUser, 
    deleteUser, 
    getAllUsers, 
    getUserById, 
    migrateUsers, 
    updateUser } from '../controllers/user.controller.js';

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/sync', migrateUsers);

export default router;