import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.middleware.js';
import { RoleController } from '../controllers/role.controller.js';

// Apply authentication middleware to all routes
router.use(authenticate);

router.get('/', checkPermission('ROLE-VIEW'), RoleController.getAllRole);
router.get('/:id', checkPermission('ROLE-VIEW'), RoleController.getRoleById);
router.post('/', checkPermission('ROLE-CREATE'), RoleController.createRole);
router.put('/:id', checkPermission('ROLE-UPDATE'), RoleController.updateRole);
router.delete('/:id', checkPermission('ROLE-DELETE'), RoleController.deleteRole);



export default router;