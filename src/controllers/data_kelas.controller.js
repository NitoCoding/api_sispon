import { prisma } from "../prisma.js"

export class DataKelasController {
  // Data Kelas Operations
  static createDataKelas = async (req, res, next) => {
    try {
      const { id_semester, id_mapel, nama } = req.body;

      const kelas = await prisma.data_kelas.create({
        data: {
          id_semester,
          id_mapel,
          nama,
          status: 'aktif'
        }
      });

      res.status(201).json({
        success: true,
        data: kelas
      });
    } catch (error) {
      next(error)
    }
  }

  static getAllDataKelas = async (req, res, next) => {
    try {
      const {tahun_ajaran, semester} = req.query;

      if(!tahun_ajaran || !semester) return res.status(400).json({
        success: false,
        message: 'Tahun ajaran and semester is required' 
      })
      const kelas = await prisma.data_kelas.findMany({
        where: {
          id_semester: parseInt(semester),
          id_semester: parseInt(semester),
        },
        include: {
          data_absensi: true,
          data_rencana_penilaian: true
        }
      });

      res.json({
        success: true,
        data: kelas
      });
    } catch (error) {
      next(error)
    }
  }

  static getDataKelasById = async (req, res, next) => {
    try {
      const { id } = req.params;

      const kelas = await prisma.data_kelas.findUnique({
        where: { id: parseInt(id) },
        include: {
          data_absensi: true,
          data_rencana_penilaian: true
        }
      });

      if (!kelas) {
        return res.status(404).json({
          success: false,
          message: 'Data kelas not found'
        });
      }

      res.json({
        success: true,
        data: kelas
      });
    } catch (error) {
      next(error)
    }
  }

  static updateDataKelas = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { id_semester, id_mapel, nama, status } = req.body;

      const kelas = await prisma.data_kelas.update({
        where: { id: parseInt(id) },
        data: {
          id_semester,
          id_mapel,
          nama,
          status
        }
      });

      res.json({
        success: true,
        data: kelas
      });
    } catch (error) {
      next(error)
    }
  }

  static deleteDataKelas = async (req, res, next) => {
    try {
      const { id } = req.params;

      await prisma.data_kelas.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        message: 'Data kelas deleted successfully'
      });
    } catch (error) {
      next(error)
    }
  }

  // Data Kelas Anggota Operations
  static addKelasAnggota = async (req, res, next) => {
    try {
      const { id_kelas, id_santri } = req.body;

      const anggota = await prisma.data_kelas_anggota.create({
        data: {
          id_kelas,
          id_santri
        }
      });

      res.status(201).json({
        success: true,
        data: anggota
      });
    } catch (error) {
      next(error)
    }
  }

  static getKelasAnggota = async (req, res, next) => {
    try {
      const { id_kelas } = req.params;

      const anggota = await prisma.data_kelas_anggota.findMany({
        where: { id_kelas: parseInt(id_kelas) }
      });

      res.json({
        success: true,
        data: anggota
      });
    } catch (error) {
      next(error)
    }
  }

  static removeKelasAnggota = async (req, res, next) => {
    try {
      const { id } = req.params;

      await prisma.data_kelas_anggota.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        message: 'Anggota kelas removed successfully'
      });
    } catch (error) {
      next(error)
    }
  }

  // Data Kelas Pengajar Operations
  static addKelasPengajar = async (req, res, next) => {
    try {
      const { id, id_guru, id_kelas } = req.body;

      const pengajar = await prisma.data_kelas_pengajar.create({
        data: {
          id,
          id_guru,
          id_kelas
        }
      });

      res.status(201).json({
        success: true,
        data: pengajar
      });
    } catch (error) {
      next(error)
    }
  }

  static getKelasPengajar = async (req, res, next) => {
    try {
      const { id_kelas } = req.params;

      const pengajar = await prisma.data_kelas_pengajar.findMany({
        where: { id_kelas: parseInt(id_kelas) }
      });

      res.json({
        success: true,
        data: pengajar
      });
    } catch (error) {
      next(error)
    }
  }

  static removeKelasPengajar = async (req, res, next) => {
    try {
      const { id } = req.params;

      await prisma.data_kelas_pengajar.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        message: 'Pengajar kelas removed successfully'
      });
    } catch (error) {
      next(error)
    }
  }
}
