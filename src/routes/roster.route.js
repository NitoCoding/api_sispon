import express from 'express';
import {authenticate} from "../middleware/auth.middleware.js";
import {RosterController} from "../controllers/roster.controller.js";
const router = express.Router();

router.get('/', authenticate, RosterController.getAllRoster);
router.post('/', authenticate, RosterController.createRoster);
router.get('/:id', authenticate, RosterController.getRosterById);

export default router;