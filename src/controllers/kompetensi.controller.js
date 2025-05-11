import { AppError } from "../middleware/errorHandler.js";
import { prisma } from "../prisma.js";

export class KompetensiController {
  static createKompetensiInti = async (req, res, next) => {
    try {
      const { kode_ki, id_kurikulum, grade, deskripsi } = req.body;
      const { created_by } = req.user;

      // Validate required fields
      if (!kode_ki || !id_kurikulum) {
        // return res.status(400).json({
        //   success: false,
        //   message: 'Kode kompetensi, kurikulum are required'
        // });
        return next(
          new AppError("Kode kompetensi, kurikulum are required", 400)
        );
      }

      // Check if curriculum exists
      const kurikulum = await prisma.ref_kurikulum.findUnique({
        where: { id: parseInt(id_kurikulum) },
      });

      if (!kurikulum) {
        // return res.status(404).json({
        //   success: false,
        //   message: 'Curriculum not found'
        // });
        return next(new AppError("Curriculum not found", 404));
      }

      // Check if kompetensi code already exists
      const existingKompetensi = await prisma.data_kompetensi_inti.findFirst({
        where: { kode_ki },
      });

      if (existingKompetensi) {
        // return res.status(400).json({
        //   success: false,
        //   message: 'Competency code already exists'
        // });
        return next(new AppError("Competency code already exists", 400));
      }

      const kompetensi = await prisma.data_kompetensi_inti.create({
        data: {
          id_kurikulum: parseInt(id_kurikulum),
          grade: parseInt(grade),
          kode_ki,
          deskripsi,
        },
      });

      res.status(201).json({
        success: true,
        data: kompetensi,
      });
    } catch (error) {
      next(new AppError(error.message, 500));
    }
  };

  static getAllKompetensiIntiByKurikulum = async (req, res, next) => {
    try {
      const { id_kurikulum } = req.params;

      const kompetensi = await prisma.data_kompetensi_inti.findMany({
        where: { id_kurikulum: parseInt(id_kurikulum) },
      });

      res.json({
        success: true,
        data: kompetensi,
      });
    } catch (error) {
      // console.error('Error fetching competencies:', error);
      // res.status(500).json({
      //   success: false,
      //   message: error.message
      // });
      next(new AppError(error.message, 500));
    }
  };

  static getKompetensiIntiById = async (req, res) => {
    try {
      const { id } = req.params;

      const kompetensi = await prisma.data_kompetensi_inti.findUnique({
        where: { id: parseInt(id) },
        include: {
          // kurikulum: true
        },
      });

      if (!kompetensi) {
        // return res.status(404).json({
        //   success: false,
        //   message: 'Competency not found'
        // });
        return next(new AppError("Competency not found", 404));
      }

      res.json({
        success: true,
        data: kompetensi,
      });
    } catch (error) {
      // console.error('Error fetching competency:', error);
      // res.status(500).json({
      //   success: false,
      //   message: error.message
      // });
      next(new AppError(error.message, 500));
    }
  };

  static updateKompetensiInti = async (req, res) => {
    try {
      const { id } = req.params;
      const { kode_ki, grade, id_kurikulum, deskripsi } = req.body;

      // Check if kompetensi exists
      const existingKompetensi = await prisma.data_kompetensi_inti.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingKompetensi) {
        return res.status(404).json({
          success: false,
          message: "Competency not found",
        });
      }

      // If code is being updated, check if it already exists
      if (kode_ki && kode_ki !== existingKompetensi.kode_kompetensi) {
        const kodeExists = await prisma.data_kompetensi_inti.findFirst({
          where: {
            kode_ki,
            NOT: {
              id: parseInt(id),
            },
          },
        });

        if (kodeExists) {
          return res.status(400).json({
            success: false,
            message: "Competency code already exists",
          });
        }
      }

      const updatedKompetensi = await prisma.data_kompetensi_inti.update({
        where: { id: parseInt(id) },
        data: {
          id_kurikulum: parseInt(id_kurikulum),
          grade: parseInt(grade),
          kode_ki,
          deskripsi,
        },
      });

      res.json({
        success: true,
        data: updatedKompetensi,
      });
    } catch (error) {
      // console.error('Error updating competency:', error);
      // res.status(500).json({
      //   success: false,
      //   message: error.message
      // });
      next(new AppError(error.message, 500));
    }
  };

  static deleteKompetensiInti = async (req, res, next) => {
    try {
      const { id } = req.params;

      // Check if kompetensi exists
      const existingKompetensi = await prisma.data_kompetensi_inti.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingKompetensi) {
        return next(new AppError("Competency not found", 404));
      }

      await prisma.data_kompetensi_inti.delete({
        where: { id: parseInt(id) },
      });

      res.json({
        success: true,
        message: "Competency deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting competency:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  static createKompetensiDasar = async (req, res) => {
    try {
      const { kode_kd, id_kurikulum, id_mapel, grade, deskripsi } = req.body;
      const { created_by } = req.user;

      // Validate required fields
      if (!kode_kd || !id_kurikulum) {
        return res.status(400).json({
          success: false,
          message: "Kode kompetensi, kurikulum are required",
        });
      }

      // Check if curriculum exists
      const kurikulum = await prisma.ref_kurikulum.findUnique({
        where: { id: parseInt(id_kurikulum) },
      });

      if (!kurikulum) {
        return res.status(404).json({
          success: false,
          message: "Curriculum not found",
        });
      }

      // Check if kompetensi code already exists
      const existingKompetensi = await prisma.data_kompetensi_dasar.findFirst({
        where: { kode_kd },
      });

      if (existingKompetensi) {
        return res.status(400).json({
          success: false,
          message: "Competency code already exists",
        });
      }

      const kompetensi = await prisma.data_kompetensi_dasar.create({
        data: {
          id_kurikulum: parseInt(id_kurikulum),
          id_mapel: parseInt(id_mapel),
          grade: parseInt(grade),
          kode_kd,
          deskripsi,
        },
      });

      res.status(201).json({
        success: true,
        data: kompetensi,
      });
    } catch (error) {
      console.error("Error creating competency:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  static getAllKompetensiDasarByMapel = async (req, res) => {
    try {
      const { id_mapel } = req.params;

      const kompetensi = await prisma.data_kompetensi_dasar.findMany({
        where: { id_mapel: parseInt(id_mapel) },
        include: {
          // ref_kurikulum: true,
          // ref_mapel: true
        },
      });

      res.json({
        success: true,
        data: kompetensi,
      });
    } catch (error) {
      console.error("Error fetching competencies:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  static updateKompetensiDasar = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { kode_kd, id_ki, grade, id_kurikulum, id_mapel, deskripsi } =
        req.body;

      // validate kode_ki
      if (id_ki) {
        const kompetensiInti = await prisma.data_kompetensi_inti.findUnique({
          where: { id: parseInt(id_ki) },
        });

        if (!kompetensiInti) {
          return next(new AppError("Competency Inti not found", 404));
        }
        // check if id_ki matches with id_kurikulum
        if (id_kurikulum && id_kurikulum !== kompetensiInti.id_kurikulum) {
          // return res.status(400).json({
          //   success: false,
          //   message: "Competency Inti does not match with curriculum",
          // });
          return next(new AppError("Competency Inti does not match with curriculum",400));
        }
      }

      // console.log("id_ki", id_ki);

      // return res.status(400).json({
      //   success: false,
      //   message: 'Competency Inti does not match with curriculum'
      // });

      // Check if kompetensi exists
      const existingKompetensi = await prisma.data_kompetensi_dasar.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingKompetensi) {
        return res.status(404).json({
          success: false,
          message: "Competency not found",
        });
      }

      // If code is being updated, check if it already exists
      if (kode_kd && kode_kd !== existingKompetensi.kode_kompetensi) {
        const kodeExists = await prisma.data_kompetensi_dasar.findFirst({
          where: {
            kode_kd,
            NOT: {
              id: parseInt(id),
            },
          },
        });

        if (kodeExists) {
          return res.status(400).json({
            success: false,
            message: "Competency code already exists",
          });
        }
      }

      const updatedKompetensi = await prisma.data_kompetensi_dasar.update({
        where: { id: parseInt(id) },
        data: {
          kode_kd,
          grade: parseInt(grade),
          id_kurikulum: parseInt(id_kurikulum),
          id_mapel: parseInt(id_mapel),
          id_ki: id_ki ? (isNaN(id_ki) ? null : parseInt(id_ki)) : null,
          deskripsi,
        },
      });

      res.json({
        success: true,
        data: updatedKompetensi,
      });
    } catch (error) {
      // console.error('Error updating competency:', error);
      // res.status(500).json({
      //   success: false,
      //   message: error.message
      // });
      next(new AppError(error.message, 500));
    }
  };

  static deleteKompetensiDasar = async (req, res) => {
    try {
      const { id } = req.params;

      // Check if kompetensi exists
      const existingKompetensi = await prisma.data_kompetensi_dasar.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingKompetensi) {
        return res.status(404).json({
          success: false,
          message: "Competency not found",
        });
      }

      await prisma.data_kompetensi_dasar.delete({
        where: { id: parseInt(id) },
      });

      res.json({
        success: true,
        message: "Competency deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting competency:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
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
