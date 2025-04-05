import { prisma } from '../prisma.js';
import mysql from 'mysql2/promise';

export class SemesterController {
  static createSemester = async(req, res) =>  {
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
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static getAllSemesters= async(req, res) =>  {
    try {
      const semesters = await prisma.ref_semester.findMany({});

      res.status(200).json(semesters);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static getSemesterById = async(req, res) => {
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
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static getActiveSemester = async(req, res) => {
    try{
      const active_semester = await prisma.ref_semester.findFirst({
        where: {
          status: 'aktif'
        }
      })
      res.status(200).json(active_semester);
    } catch (e) {
      res.status(500).json({
        "message" : e.message
      })
    }
  }

  static setActiveSemester = async(req, res) => {
    try{
      const { id } = req.params;
      await prisma.ref_semester.updateMany({
        where: {
          status: 'aktif'
        },
        data: {
          status: 'nonaktif'
        }
      })
      const updatedSemester = await prisma.ref_semester.update({
        where: {
          id: parseInt(id)
        },
        data: {
          status: 'aktif'
        }
      })
      res.status(200).json(updatedSemester)
    } catch (e) {
      res.status(500).json({
        "message" : e.message
      })
    }
  }

  static updateSemester = async(req, res) =>  {
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
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static deleteSemester = async(req, res) =>  {
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
      res.status(500).json({
        success: false,
        message: error.message
      });
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
              status: 'aktif'
            }
          });
          const semester2 = await prisma.ref_semester.create({
            data: {
              id_tahun_ajaran: tahun.id,
              nama: 'Genap ' + tahun.nama,
              urutan: 2,
              status: 'aktif'
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