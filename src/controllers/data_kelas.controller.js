import { AppError } from "../middleware/errorHandler.js";
import { prisma } from "../prisma.js"
import {getTokenPayload} from "../helpers.js";

export class DataKelasController {

  static getPegawaiDetail = async (req) => {
    const userId = req.userId
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });
    const pegawaiKode = user.kode_pegawai
    const pegawai = await prisma.guru_pegawai.findUnique({
      where: { kode_pegawai: pegawaiKode },
    });

    // console.log(pegawai.)
    
    return pegawai
  }
  // Data Kelas Operations
  static createDataKelas = async (req, res, next) => {
    try {
      const payload = req.payload;
      const semesterId = payload.semester

      // const pegawai = await DataKelasController.getPegawaiDetail(payload)
      
      // const gender = pegawai.jk

      const { id_ruang,id_mapel } = req.body;

      const semesterNama = await prisma.ref_semester.findUnique({
        where: { id: parseInt(semesterId) }
      });
      const mapelNama = await prisma.ref_mapel.findUnique({
        where: { id: parseInt(id_mapel) }
      });
      const ruangNama = await prisma.ref_kelas.findUnique({
        where: { id: parseInt(id_ruang) }
      })

      const nama = `${mapelNama.nama} ${semesterNama.nama} ${ruangNama.kode} ${tipe} ${gender}`

      const kelas = await prisma.data_kelas.create({
        data: {
          id_semester : parseInt(semesterId),
          id_ruang,
          id_mapel,
          nama,
          // gender,
          // tipe,
          status: 'aktif'
        }
      });

      res.status(201).json({
        success: true,
        data: kelas
      });
    } catch (error) {
      next(new AppError(error.message, 500));
    }
  }

  static getAllDataKelas = async (req, res, next) => {
    try {
      const { decoded, semester, tahunAjaran } = await getTokenPayload(req);

      const kelas = await prisma.data_kelas.findMany({
        where: {
          id_semester: parseInt(semester.id),
        },
        include: {
          data_absensi: true,
          data_rencana_penilaian: {
            include: {
              ref_komponen_nilai: true
            }
          }
        }
      });

      res.json(kelas);
    } catch (error) {
      next(AppError(error.message, 500));
    }
  }

  static getDataKelasById = async (req, res, next) => {
    try {
      const { id } = req.params;

      const kelas = await prisma.data_kelas.findUnique({
        where: { id: parseInt(id) },
        // include: {
          // data_absensi: true,
          // data_rencana_penilaian: true
        // }
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
      next(AppError(error.message, 500));
    }
  }

  static updateDataKelas = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { id_mapel, gender,tipe,kode_kelas, status } = req.body;

      const semesterNama = await prisma.ref_semester.findUnique({
        where: { id: parseInt(id_semester) }
      });
      const mapelNama = await prisma.ref_mapel.findUnique({
        where: { id: parseInt(id_mapel) }
      });

      const nama = `${mapelNama.nama} ${semesterNama.nama} ${kode_kelas} ${tipe} ${gender}`

      const kelas = await prisma.data_kelas.update({
        where: { id: parseInt(id) },
        data: {
          id_semester,
          id_mapel,
          nama,
          status,
          tipe,
          gender,
          kode_kelas
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

  static lockDataKelas = async (req, res, next) => {
    try {
      const { id } = req.params;

      const kelas = await prisma.data_kelas.update({
        where: { id: parseInt(id) },
        data: {
          is_locked: true
        }
      });

      res.json({
        message: "Data kelas berhasil dikunci",
        data: kelas
      });
    } catch (error) {
      next(error)
    }
  }

  static unlockDataKelas = async (req, res, next) => {
    try {
      const { id } = req.params;

      const kelas = await prisma.data_kelas.update({
        where: { id: parseInt(id) },
        data: {
          is_locked: false
        }
      });

      res.json({
        message: "Data kelas berhasil dibuka kuncinya",
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
