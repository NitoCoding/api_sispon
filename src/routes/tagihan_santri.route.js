import express from 'express';
import { tagihanSantriController } from '../controllers/tagihan_santri.controller.js';
// import { validate } from '../middleware/validate.middleware.js';
import { createTagihanValidation, updateTagihanValidation } from '../validators/tagihan_santri.validator.js';
import { deleteValidation } from '../validators/param_id.validator.js';


const router = express.Router();

// router.use('tagihan_santri', router)

router.get('/', tagihanSantriController.getJenisTagihan)
router.post('/', createTagihanValidation,tagihanSantriController.createJenisTagihanSantri)
router.put('/:id', updateTagihanValidation,tagihanSantriController.updateJenisTagihanSantri)
router.delete('/:id', deleteValidation,tagihanSantriController.deleteJenisTagihanSantri)


export default router;