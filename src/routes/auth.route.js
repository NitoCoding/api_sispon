import express from 'express';

const router = express.Router();

import {AuthController} from '../controllers/auth.controller.js';
import {authenticate} from "../middleware/auth.middleware.js";

router.post('/login', AuthController.login);
router.post('/choose-semester/:id_semester', authenticate, AuthController.chooseSemester);
router.post('/choose-role/:id_role', authenticate, AuthController.changeRole);

export default router;