import { prisma } from "../prisma.js";

export class RombelController {
  static createRombel = async (req, res) => {
    try {
      const { id_kelas, id_tahun_ajaran, id_wali_kelas, nama } = req.body;

      const rombel = await prisma.data_rombel.create({
        data: {
          id_kelas,
          id_tahun_ajaran,
          id_wali_kelas,
          nama,
          status: "aktif",
        },
      });

      res.json({
        success: true,
        data: rombel,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  static getRombels = async (req, res) => {
    try {
      const rombels = await prisma.data_rombel.findMany({
        include: {
          data_rombel_anggota: true,
        },
      });

      res.json({
        success: true,
        data: rombels,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  static getRombelById = async (req, res) => {
    try {
      const { id } = req.params;
      const rombel = await prisma.data_rombel.findUnique({
        where: { id: parseInt(id) },
        include: {
          data_rombel_anggota: true,
        },
      });

      if (!rombel) {
        return res.status(404).json({
          success: false,
          message: "Rombel not found",
        });
      }

      res.json({
        success: true,
        data: rombel,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  static updateRombel = async (req, res) => {
    try {
      const { id } = req.params;
      const { id_kelas, id_tahun_ajaran, id_wali_kelas, nama, status } =
        req.body;

      const rombel = await prisma.data_rombel.update({
        where: { id: parseInt(id) },
        data: {
          id_kelas,
          id_tahun_ajaran,
          id_wali_kelas,
          nama,
          status,
        },
      });

      res.json({
        success: true,
        data: rombel,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  static deleteRombel = async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.data_rombel_anggota.deleteMany({
        where: { id_rombel: parseInt(id) },
      });

      await prisma.data_rombel.delete({
        where: { id: parseInt(id) },
      });

      res.json({
        success: true,
        message: "Rombel deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  static addStudentToRombel = async (req, res) => {
    try {
      const { id_rombel, id_santri } = req.body;

      const anggota = await prisma.data_rombel_anggota.create({
        data: {
          id_rombel: parseInt(id_rombel),
          id_santri: parseInt(id_santri),
          status: "aktif",
        },
      });

      res.json({
        success: true,
        data: anggota,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  static removeStudentFromRombel = async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.data_rombel_anggota.delete({
        where: { id: parseInt(id) },
      });

      res.json({
        success: true,
        message: "Student removed from rombel successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
}
