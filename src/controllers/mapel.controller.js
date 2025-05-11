import { AppError } from "../middleware/errorHandler.js";
import { prisma } from "../prisma.js";

export class MapelController {
  static createMapel = async (req, res) => {
    try {
      const { kode, nama, nama_arab, keterangan, sifat } = req.body;
      const { id_kurikulum } = req.params;

      // Validate required fields
      if (!kode || !nama) {
        return res.status(400).json({
          success: false,
          message: "Kode and nama are required"
        });
      }

      // Check if curriculum exists
      const kurikulum = await prisma.ref_kurikulum.findUnique({
        where: { id: parseInt(id_kurikulum) }
      });

      if (!kurikulum) {
        return res.status(404).json({
          success: false,
          message: "Curriculum not found"
        });
      }

      // Check if mapel code already exists for this curriculum
      const existingMapel = await prisma.ref_mapel.findFirst({
        where: {
          kode,
          // nama,
          // keterangan,
          id_kurikulum: parseInt(id_kurikulum)
        }
      });

      if (existingMapel) {
        return res.status(400).json({
          success: false,
          message: "Subject code already exists in this curriculum"
        });
      }

      const newMapel = await prisma.ref_mapel.create({
        data: {
          kode,
          nama,
          nama_arab,
          keterangan,
          sifat : sifat || "A",
          id_kurikulum: parseInt(id_kurikulum)
        }
      });

      res.status(201).json({
        success: true,
        data: newMapel
      });
    } catch (error) {
      console.error("Error creating mapel:", error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  static getAllMapel = async (req, res) => {
    try {
      const { id_kurikulum } = req.params;

      const mapel = await prisma.ref_mapel.findMany({
        where: {
          id_kurikulum: parseInt(id_kurikulum)
        }
      });

      res.json({
        success: true,
        data: mapel
      });
    } catch (error) {
      console.error("Error fetching mapel:", error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  static getMapelById = async (req, res, next) => {
    try {
      const { id, id_kurikulum } = req.params;

      const mapel = await prisma.ref_mapel.findFirst({
        where: {
          id: parseInt(id),
          id_kurikulum: parseInt(id_kurikulum)
        }
      });

      if (!mapel) {
        return next(new AppError("Subject not found", 404));
      }

      res.json({
        success: true,
        data: mapel
      });
    } catch (error) {
      // console.error("Error fetching mapel:", error);
      // res.status(500).json({
      //   success: false,
      //   message: error.message
      // });
      next(new AppError(error.message, 500));
    }
  };

  static updateMapel = async (req, res, next) => {
    try {
      const { id, id_kurikulum } = req.params;
      const { kode, nama, nama_arab, keterangan, sifat } = req.body;

      // Check if mapel exists
      const existingMapel = await prisma.ref_mapel.findFirst({
        where: {
          id: parseInt(id),
          id_kurikulum: parseInt(id_kurikulum)
        }
      });

      if (!existingMapel) {
        return next(new AppError("Subject not found", 404));
      }

      // If code is being updated, check if it already exists
      if (kode && kode !== existingMapel.kode) {
        const kodeExists = await prisma.ref_mapel.findFirst({
          where: {
            kode,
            keterangan,
            id_kurikulum: parseInt(id_kurikulum),
            NOT: {
              id: parseInt(id)
            }
          }
        });

        if (kodeExists) {
          next(new AppError("Subject code already exists", 400));
        }
      }

      const updatedMapel = await prisma.ref_mapel.update({
        where: { id: parseInt(id) },
        data: {
          kode,
          nama,
          nama_arab,
          keterangan,
          sifat
        }
      });

      res.json({
        success: true,
        data: updatedMapel
      });
    } catch (error) {
      // console.error("Error updating mapel:", error);
      // res.status(500).json({
      //   success: false,
      //   message: error.message
      // });
      next(new AppError(error.message, 500));
    }
  };

  static deleteMapel = async (req, res, next) => {
    try {
      const { id, id_kurikulum } = req.params;

      // Check if mapel exists
      const existingMapel = await prisma.ref_mapel.findFirst({
        where: {
          id: parseInt(id),
          id_kurikulum: parseInt(id_kurikulum)
        }
      });

      if (!existingMapel) {
        next(new AppError("Subject not found", 404));
      }

      await prisma.ref_mapel.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        message: "Subject deleted successfully"
      });
    } catch (error) {
      // console.error("Error deleting mapel:", error);
      // res.status(500).json({
      //   success: false,
      //   message: error.message
      // });
      next(new AppError(error.message, 500));
    }
  };
}