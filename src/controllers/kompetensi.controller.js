import { prisma } from '../prisma.js';

export class KompetensiController {
  static createKompetensi = async (req, res, next) => {
    try {
      const { kode_kompetensi, id_kurikulum, id_mapel, fase, tingkat, konten } = req.body;
      const { created_by } = req.user;

      // Validate required fields
      if (!kode_kompetensi || !id_kurikulum || !id_mapel) {
        return res.status(400).json({
          success: false,
          message: 'Kode kompetensi, kurikulum, and mapel are required'
        });
      }

      // Check if curriculum exists
      const kurikulum = await prisma.ref_kurikulum.findUnique({
        where: { id: parseInt(id_kurikulum) }
      });

      if (!kurikulum) {
        return res.status(404).json({
          success: false,
          message: 'Curriculum not found'
        });
      }

      // Check if mapel exists
      const mapel = await prisma.ref_mapel.findFirst({
        where: {
          id: parseInt(id_mapel),
          id_kurikulum: parseInt(id_kurikulum)
        }
      });

      if (!mapel) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found in the specified curriculum'
        });
      }

      // Check if kompetensi code already exists
      const existingKompetensi = await prisma.data_kompetensi.findFirst({
        where: { kode_kompetensi }
      });

      if (existingKompetensi) {
        return res.status(400).json({
          success: false,
          message: 'Competency code already exists'
        });
      }

      const kompetensi = await prisma.data_kompetensi.create({
        data: {
          kode_kompetensi,
          id_kurikulum: parseInt(id_kurikulum),
          id_mapel,
          fase,
          tingkat,
          konten,
          created_by
        }
      });

      res.status(201).json({
        success: true,
        data: kompetensi
      });
    } catch (error) {
      next(error);
    }
  }

  static getAllKompetensiByKurikulum = async (req, res, next) => {
    try {
      const { id_kurikulum } = req.params;

      const kompetensi = await prisma.data_kompetensi.findMany({
        where: { id_kurikulum: parseInt(id_kurikulum) },
        include: {
          ref_kurikulum: true,
          ref_mapel: true
        }
      });

      res.json({
        success: true,
        data: kompetensi
      });
    } catch (error) {
      next(error);
    }
  }

  static getAllKompetensiByMapel = async (req, res, next) => {
    try {
      const { id_kurikulum, id_mapel } = req.params;

      const kompetensi = await prisma.data_kompetensi.findMany({
        where: {
          id_kurikulum: parseInt(id_kurikulum),
          id_mapel
        },
        include: {
          ref_kurikulum: true,
          ref_mapel: true
        }
      });

      res.json({
        success: true,
        data: kompetensi
      });
    } catch (error) {
      next(error);
    }
  }

  static getKompetensiById = async (req, res, next) => {
    try {
      const { id } = req.params;

      const kompetensi = await prisma.data_kompetensi.findUnique({
        where: { id: parseInt(id) },
        include: {
          ref_kurikulum: true,
          ref_mapel: true
        }
      });

      if (!kompetensi) {
        return res.status(404).json({
          success: false,
          message: 'Competency not found'
        });
      }

      res.json({
        success: true,
        data: kompetensi
      });
    } catch (error) {
      next(error);
    }
  }

  static updateKompetensi = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { kode_kompetensi, fase, tingkat, konten } = req.body;

      // Check if kompetensi exists
      const existingKompetensi = await prisma.data_kompetensi.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingKompetensi) {
        return res.status(404).json({
          success: false,
          message: 'Competency not found'
        });
      }

      // If code is being updated, check if it already exists
      if (kode_kompetensi && kode_kompetensi !== existingKompetensi.kode_kompetensi) {
        const kodeExists = await prisma.data_kompetensi.findFirst({
          where: {
            kode_kompetensi,
            NOT: {
              id: parseInt(id)
            }
          }
        });

        if (kodeExists) {
          return res.status(400).json({
            success: false,
            message: 'Competency code already exists'
          });
        }
      }

      const updatedKompetensi = await prisma.data_kompetensi.update({
        where: { id: parseInt(id) },
        data: {
          kode_kompetensi,
          fase,
          tingkat,
          konten
        }
      });

      res.json({
        success: true,
        data: updatedKompetensi
      });
    } catch (error) {
      next(error);
    }
  }

  static deleteKompetensi = async (req, res, next) => {
    try {
      const { id } = req.params;

      // Check if kompetensi exists
      const existingKompetensi = await prisma.data_kompetensi.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingKompetensi) {
        return res.status(404).json({
          success: false,
          message: 'Competency not found'
        });
      }

      await prisma.data_kompetensi.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        message: 'Competency deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}