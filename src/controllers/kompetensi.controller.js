import { prisma } from '../prisma.js';

export class KompetensiController {
  static createKompetensiInti = async (req, res) => {
    try {
      const { kode_ki, id_kurikulum, id_mapel, grade, deskripsi} = req.body;
      const { created_by } = req.user;

      // Validate required fields
      if (!kode_ki || !id_kurikulum) {
        return res.status(400).json({
          success: false,
          message: 'Kode kompetensi, kurikulum are required'
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

      // Check if kompetensi code already exists
      const existingKompetensi = await prisma.data_kompetensi_inti.findFirst({
        where: { kode_ki }
      });

      if (existingKompetensi) {
        return res.status(400).json({
          success: false,
          message: 'Competency code already exists'
        });
      }

      const kompetensi = await prisma.data_kompetensi_inti.create({
        data: {
          id_kurikulum: parseInt(id_kurikulum),
          grade,
          kode_ki,
          deskripsi,
          created_by
        }
      });

      res.status(201).json({
        success: true,
        data: kompetensi
      });
    } catch (error) {
      console.error('Error creating competency:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static getAllKompetensiIntiByKurikulum = async (req, res) => {
    try {
      const { id_kurikulum } = req.params;

      const kompetensi = await prisma.data_kompetensi_inti.findMany({
        where: { id_kurikulum: parseInt(id_kurikulum) },
        include: {
          ref_kurikulum: true,
        }
      });

      res.json({
        success: true,
        data: kompetensi
      });
    } catch (error) {
      console.error('Error fetching competencies:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }


  static getKompetensiIntiById = async (req, res) => {
    try {
      const { id } = req.params;

      const kompetensi = await prisma.data_kompetensi_inti.findUnique({
        where: { id: parseInt(id) },
        include: {
          ref_kurikulum: true,
          // ref_mapel: true
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
      console.error('Error fetching competency:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static updateKompetensiInti = async (req, res) => {
    try {
      const { id } = req.params;
      const { kode_ki, grade,id_kurikulum, konten } = req.body;

      // Check if kompetensi exists
      const existingKompetensi = await prisma.data_kompetensi_inti.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingKompetensi) {
        return res.status(404).json({
          success: false,
          message: 'Competency not found'
        });
      }

      // If code is being updated, check if it already exists
      if (kode_ki && kode_ki !== existingKompetensi.kode_kompetensi) {
        const kodeExists = await prisma.data_kompetensi_inti.findFirst({
          where: {
            kode_ki,
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

      const updatedKompetensi = await prisma.data_kompetensi_inti.update({
        where: { id: parseInt(id) },
        data: {
          kode_ki,
          grade,
          id_kurikulum,
          deskripsi
        }
      });

      res.json({
        success: true,
        data: updatedKompetensi
      });
    } catch (error) {
      console.error('Error updating competency:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static deleteKompetensiInti = async (req, res) => {
    try {
      const { id } = req.params;

      // Check if kompetensi exists
      const existingKompetensi = await prisma.data_kompetensi_inti.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingKompetensi) {
        return res.status(404).json({
          success: false,
          message: 'Competency not found'
        });
      }

      await prisma.data_kompetensi_inti.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        message: 'Competency deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting competency:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static createKompetensiDasar = async (req, res) => {
    try {
      const { kode_kd, id_kurikulum, id_mapel, grade, deskripsi } = req.body;
      const { created_by } = req.user;

      // Validate required fields
      if (!kode_kd || !id_kurikulum) {
        return res.status(400).json({
          success: false,
          message: 'Kode kompetensi, kurikulum are required'
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

      // Check if kompetensi code already exists
      const existingKompetensi = await prisma.data_kompetensi_dasar.findFirst({
        where: { kode_kd }
      });

      if (existingKompetensi) {
        return res.status(400).json({
          success: false,
          message: 'Competency code already exists'
        });
      }

      const kompetensi = await prisma.data_kompetensi_dasar.create({
        data: {
          id_kurikulum: parseInt(id_kurikulum),
          id_mapel,
          grade,
          kode_kd,
          deskripsi,
          created_by
        }
      });

      res.status(201).json({
        success: true,
        data: kompetensi
      });
    } catch (error) {
      console.error('Error creating competency:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static getAllKompetensiDasarByMapel = async (req, res) => {
    try {
      const { id_mapel } = req.params;

      const kompetensi = await prisma.data_kompetensi_dasar.findMany({
        where: { id_mapel: parseInt(id_mapel) },
        include: {
          // ref_kurikulum: true,
          ref_mapel: true
        }
      });

      res.json({
        success: true,
        data: kompetensi
      });
    } catch (error) {
      console.error('Error fetching competencies:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static updateKompetensiDasar = async (req, res) => {
    try {
      const { id } = req.params;
      const { kode_kd, grade, id_kurikulum, id_mapel, deskripsi } = req.body;

      // Check if kompetensi exists
      const existingKompetensi = await prisma.data_kompetensi_dasar.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingKompetensi) {
        return res.status(404).json({
          success: false,
          message: 'Competency not found'
        });
      }

      // If code is being updated, check if it already exists
      if (kode_kd && kode_kd !== existingKompetensi.kode_kompetensi) {
        const kodeExists = await prisma.data_kompetensi_dasar.findFirst({
          where: {
            kode_kd,
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

      const updatedKompetensi = await prisma.data_kompetensi_dasar.update({
        where: { id: parseInt(id) },
        data: {
          kode_kd,
          grade,
          id_kurikulum,
          id_mapel,
          deskripsi
        }
      });

      res.json({
        success: true,
        data: updatedKompetensi
      });
    } catch (error) {
      console.error('Error updating competency:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static deleteKompetensiDasar = async (req, res) => {
    try {
      const { id } = req.params;

      // Check if kompetensi exists
      const existingKompetensi = await prisma.data_kompetensi_dasar.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingKompetensi) {
        return res.status(404).json({
          success: false,
          message: 'Competency not found'
        });
      }

      await prisma.data_kompetensi_dasar.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        message: 'Competency deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting competency:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

}

  // static getAllKompetensiDasarByMapel = async (req, res) => {
  //   try {
  //     const { id_kurikulum, id_mapel } = req.params;

  //     const kompetensi = await prisma.data_kompetensi_inti.findMany({
  //       where: {
  //         id_kurikulum: parseInt(id_kurikulum),
  //         id_mapel
  //       },
  //       include: {
  //         ref_kurikulum: true,
  //         ref_mapel: true
  //       }
  //     });

  //     res.json({
  //       success: true,
  //       data: kompetensi
  //     });
  //   } catch (error) {
  //     console.error('Error fetching competencies:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: error.message
  //     });
  //   }
  // }
