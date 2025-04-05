import express from 'express';

const router = express.Router();

import {chooseSemester, login} from '../controllers/auth.controller.js';
import {authenticate} from "../middleware/auth.middleware.js";

router.post('/login', login);
router.post('/choose-semester/:id_semester', authenticate, chooseSemester);

export default router;