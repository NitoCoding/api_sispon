import { prisma } from "../prisma.js";

export class KelasController {
  static createKelas = async (req, res) => {
    try {
      const {
        kode,
        kelas,
        kapasitas,
        jumlah_meja,
        meja_rusak,
        jumlah_kursi,
        kursi_rusak,
        jumlah_lemari,
        lemari_rusak,
        jumlah_ptulis,
        ptulis_rusak,
        proyektor,
      } = req.body;

      // Validate required fields
      if (!kode || !kelas) {
        return res.status(400).json({ message: "Kode and kelas are required" });
      }

      // Check if kode already exists
      const existingKelas = await prisma.ref_kelas.findUnique({
        where: { kode },
      });

      if (existingKelas) {
        return res.status(400).json({ message: "Kode kelas already exists" });
      }

      const newKelas = await prisma.ref_kelas.create({
        data: {
          kode,
          kelas,
          kapasitas,
          jumlah_meja,
          meja_rusak,
          jumlah_kursi,
          kursi_rusak,
          jumlah_lemari,
          lemari_rusak,
          jumlah_ptulis,
          ptulis_rusak,
          proyektor,
        },
      });

      res.status(201).json(newKelas);
    } catch (error) {
      console.error("Error creating kelas:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  static getAllKelas = async (req, res) => {
    try {
      const kelas = await prisma.ref_kelas.findMany({
        include: {
          data_konfigurasi_biaya: true,
        },
      });
      res.json(kelas);
    } catch (error) {
      console.error("Error fetching kelas:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  static getKelasById = async (req, res) => {
    try {
      const { id } = req.params;
      const kelas = await prisma.ref_kelas.findUnique({
        where: { id: parseInt(id) },
        include: {
          data_konfigurasi_biaya: true,
        },
      });

      if (!kelas) {
        return res.status(404).json({ message: "Kelas not found" });
      }

      res.json(kelas);
    } catch (error) {
      console.error("Error fetching kelas:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  static updateKelas = async (req, res) => {
    try {
      const { id } = req.params;
      const {
        kode,
        kelas,
        kapasitas,
        jumlah_meja,
        meja_rusak,
        jumlah_kursi,
        kursi_rusak,
        jumlah_lemari,
        lemari_rusak,
        jumlah_ptulis,
        ptulis_rusak,
        proyektor,
      } = req.body;

      // Check if kelas exists
      const existingKelas = await prisma.ref_kelas.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingKelas) {
        return res.status(404).json({ message: "Kelas not found" });
      }

      // If kode is being updated, check if new kode already exists
      if (kode && kode !== existingKelas.kode) {
        const kodeExists = await prisma.ref_kelas.findUnique({
          where: { kode },
        });

        if (kodeExists) {
          return res.status(400).json({ message: "Kode kelas already exists" });
        }
      }

      const updatedKelas = await prisma.ref_kelas.update({
        where: { id: parseInt(id) },
        data: {
          kode,
          kelas,
          kapasitas,
          jumlah_meja,
          meja_rusak,
          jumlah_kursi,
          kursi_rusak,
          jumlah_lemari,
          lemari_rusak,
          jumlah_ptulis,
          ptulis_rusak,
          proyektor,
        },
      });

      res.json(updatedKelas);
    } catch (error) {
      console.error("Error updating kelas:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  static deleteKelas = async (req, res) => {
    try {
      const { id } = req.params;

      // Check if kelas exists
      const existingKelas = await prisma.ref_kelas.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingKelas) {
        return res.status(404).json({ message: "Kelas not found" });
      }

      // Check if kelas has any related data_konfigurasi_biaya
      const hasRelatedData = await prisma.data_konfigurasi_biaya.findFirst({
        where: { id_kelas: parseInt(id) },
      });

      if (hasRelatedData) {
        return res.status(400).json({
          message: "Cannot delete kelas with related configuration data",
        });
      }

      await prisma.ref_kelas.delete({
        where: { id: parseInt(id) },
      });

      res.json({ message: "Kelas deleted successfully" });
    } catch (error) {
      console.error("Error deleting kelas:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}
