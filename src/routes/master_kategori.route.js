import express from 'express';
import { MasterKategoriController } from '../controllers/master_kategori.controller.js';

const router = express.Router();

router.post("/",MasterKategoriController.createMasterKategori);
router.get("/", MasterKategoriController.getAllMasterKategori);
router.get("/unique-types", MasterKategoriController.getUniqueTipe);
router.get("/:id", MasterKategoriController.getMasterKategoriById);
router.put("/:id", MasterKategoriController.updateMasterKategori);
router.delete("/:id", MasterKategoriController.deleteMasterKategori);

export default router;