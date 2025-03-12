import prisma from '../prisma.js';

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
      const semesters = await prisma.ref_semester.findMany({
        include: {
          ref_tahun_ajaran: true
        }
      });

      res.json({
        success: true,
        data: semesters
      });
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
}