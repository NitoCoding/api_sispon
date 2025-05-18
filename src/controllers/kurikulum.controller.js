import prisma from '../prisma.js';

export class KurikulumController {
  static createKurikulum = async(req, res, next) =>  {
    try {
      const { nama } = req.body;

      if (!nama) {
        return res.status(400).json({
          success: false,
          message: 'Nama is required'
        });
      }

      const kurikulum = await prisma.ref_kurikulum.create({
        data: { nama }
      });

      res.status(201).json({
        success: true,
        data: kurikulum
      });
    } catch (error) {
      next(error);
    }
  }

  static getAllKurikulum = async(req, res, next) =>  {
    try {
      const kurikulum = await prisma.ref_kurikulum.findMany();

      res.json({
        success: true,
        data: kurikulum
      });
    } catch (error) {
      next(error);
    }
  }

  static getKurikulumById = async(req, res, next) => {
    try {
      const { id } = req.params;

      const kurikulum = await prisma.ref_kurikulum.findUnique({
        where: { id: parseInt(id) }
      });

      if (!kurikulum) {
        return res.status(404).json({
          success: false,
          message: 'Kurikulum not found'
        });
      }

      res.json({
        success: true,
        data: kurikulum
      });
    } catch (error) {
      next(error);
    }
  }

  static updateKurikulum = async(req, res, next) =>  {
    try {
      const { id } = req.params;
      const { nama } = req.body;

      if (!nama) {
        return res.status(400).json({
          success: false,
          message: 'Nama is required'
        });
      }

      const kurikulum = await prisma.ref_kurikulum.update({
        where: { id: parseInt(id) },
        data: { nama }
      });

      res.json({
        success: true,
        data: kurikulum
      });
    } catch (error) {
      next(error);
    }
  }

  static deleteKurikulum = async(req, res, next) =>  {
    try {
      const { id } = req.params;

      await prisma.ref_kurikulum.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        message: 'Kurikulum deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}