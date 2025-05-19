import express from 'express';
import { CoaController } from '../controllers/coa.controller.js';
import { createCoaValidation, updateCoaValidation } from '../validators/coa.validator.js';
import { deleteValidation } from '../validators/param_id.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';


const router = express.Router();

// router.use('tagihan_santri', router)
router.use(authenticate)

router.get('/',CoaController.getCoa)
router.post('/',createCoaValidation, CoaController.createCoa)
router.put('/:id',updateCoaValidation, CoaController.updateCoa)
router.delete('/:id', deleteValidation,CoaController.deleteCoa)

// router.post('/', )

export default router;