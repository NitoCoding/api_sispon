import { prisma } from '../prisma.js';
import mysql from 'mysql2/promise';

/*
Master Kategori Ref Semester:
- 11 = Aktif
- 12 = Inktif
*/

export class SemesterController {
  static createSemester = async(req, res, next) =>  {
    try {
      const { id_tahun_ajaran, nama, urutan, status } = req.body;

      const semester = await prisma.ref_semester.create({
        data: {
          id_tahun_ajaran,
          nama,
          urutan,
          status
        }
      });

      res.status(201).json({
        success: true,
        data: semester
      });
    } catch (error) {
      next(error);
    }
  }

  static getAllSemesters= async(req, res, next) =>  {
    try {
      const semesters = await prisma.ref_semester.findMany({
        include: {
          ref_tahun_ajaran: true,
          ref_master_kategori_status_ref_semester: true
        },
        orderBy: {
          id: 'desc'
        }
      });

      const flatSemesters = semesters.map((semester) => {
        const { ref_tahun_ajaran, ref_master_kategori_status_ref_semester, ...rest } = semester;
        return {
          ...rest,
          status: ref_master_kategori_status_ref_semester.nama,
          tahun_ajaran: ref_tahun_ajaran.nama
        };
      });

      res.status(200).json(flatSemesters);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static getSemesterById = async(req, res, next) => {
    try {
      const { id } = req.params;

      const semester = await prisma.ref_semester.findUnique({
        where: { id: parseInt(id) },
        include: {
          ref_tahun_ajaran: true
        }
      });

      if (!semester) {
        return res.status(404).json({
          success: false,
          message: 'Semester not found'
        });
      }

      res.json({
        success: true,
        data: semester
      });
    } catch (error) {
      next(error);
    }
  }

  static getActiveSemester = async(req, res, next) => {
    try{
      const active_semester = await prisma.ref_semester.findFirst({
        where: {
          id_master_kategori_status_ref_semester: 11,
        },
        include: {
          ref_master_kategori_status_ref_semester: true,
          ref_tahun_ajaran: true
        }
      })

      const { ref_tahun_ajaran, ref_master_kategori_status_ref_semester, ...rest } = active_semester;
      const flatActiveSemester = {
        ...rest,
        status: ref_master_kategori_status_ref_semester.nama,
        tahun_ajaran: ref_tahun_ajaran.nama
      }

      res.status(200).json(flatActiveSemester);
    } catch (e) {
      next(e);
    }
  }

  static setActiveSemester = async(req, res, next) => {
    try{
      const { id } = req.params;
      await prisma.ref_semester.updateMany({
        where: {
          id_master_kategori_status_ref_semester: 11
        },
        data: {
          id_master_kategori_status_ref_semester: 12
        }
      })
      const updatedSemester = await prisma.ref_semester.update({
        where: {
          id: parseInt(id)
        },
        data: {
          id_master_kategori_status_ref_semester: 11
        }
      })
      res.status(200).json(updatedSemester)
    } catch (e) {
      next(e);
    }
  }

  static updateSemester = async(req, res, next) =>  {
    try {
      const { id } = req.params;
      const { id_tahun_ajaran, nama, urutan, status } = req.body;

      const semester = await prisma.ref_semester.update({
        where: { id: parseInt(id) },
        data: {
          id_tahun_ajaran,
          nama,
          urutan,
          status
        }
      });

      res.json({
        success: true,
        data: semester
      });
    } catch (error) {
      next(error);
    }
  }

  static deleteSemester = async(req, res, next) =>  {
    try {
      const { id } = req.params;

      await prisma.ref_semester.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        message: 'Semester deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static migrateSemester = async(req, res) =>  {
    try {
      const tahun_ajaran = await prisma.ref_tahun_ajaran.findMany();

      for(const tahun of tahun_ajaran) {
        const semester = await prisma.ref_semester.findFirst({
          where: { id_tahun_ajaran: parseInt(tahun.id) },
        });
        if(!semester){
          const semester = await prisma.ref_semester.create({
            data: {
              id_tahun_ajaran: tahun.id,
              nama: 'Ganjil ' + tahun.nama,
              urutan: 1,
              id_master_kategori_status_ref_semester: 11
            }
          });
          const semester2 = await prisma.ref_semester.create({
            data: {
              id_tahun_ajaran: tahun.id,
              nama: 'Genap ' + tahun.nama,
              urutan: 2,
              id_master_kategori_status_ref_semester: 11
            }
          });
        }
      }
      res.status(200).json({
        success: true,
        message: 'Semester migrated successfully'
      })
    } catch (error) {
      console.log(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
  }
}