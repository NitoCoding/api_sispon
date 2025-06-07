import express from 'express';

const router = express.Router();

import {RoleController} from "../controllers/role.controller.js";
import {authenticate} from "../middleware/auth.middleware.js";

router.get('/', authenticate, RoleController.getAllRoles);
router.get('/:id', authenticate, RoleController.getRoleById);
router.post('/', authenticate, RoleController.createRole);
router.put('/:id', authenticate, RoleController.updateRole);
router.delete('/:id', authenticate, RoleController.deleteRole);

export default router;