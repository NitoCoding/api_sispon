import express from 'express';

const router = express.Router();

import { UserController} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

router.get('/', authenticate, UserController.getAllUsers);
// router.get('/', authenticate, UserController.getAllUsersByRole);
router.get('/:id', UserController.getUserById);
router.post('/', UserController.createUser);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

router.get('/sync', UserController.migrateUsers);

export default router;