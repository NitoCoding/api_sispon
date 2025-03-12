import { prisma } from "../prisma.js";

export class MapelController {
  static createMapel = async (req, res) => {
    try {
      const { kode, nama, kkm_1, kkm_2, kkm_3, keterangan, sifat } = req.body;
      const { idkur } = req.params;

      // Validate required fields
      if (!kode || !nama) {
        return res.status(400).json({
          success: false,
          message: "Kode and nama are required"
        });
      }

      // Check if curriculum exists
      const kurikulum = await prisma.ref_kurikulum.findUnique({
        where: { id: parseInt(idkur) }
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
          keterangan,
          id_kurikulum: parseInt(idkur)
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
          kkm_1,
          kkm_2,
          kkm_3,
          keterangan,
          sifat,
          id_kurikulum: parseInt(idkur)
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
      const { idkur } = req.params;

      const mapel = await prisma.ref_mapel.findMany({
        where: {
          id_kurikulum: parseInt(idkur)
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

  static getMapelById = async (req, res) => {
    try {
      const { id, idkur } = req.params;

      const mapel = await prisma.ref_mapel.findFirst({
        where: {
          id: parseInt(id),
          id_kurikulum: parseInt(idkur)
        }
      });

      if (!mapel) {
        return res.status(404).json({
          success: false,
          message: "Subject not found"
        });
      }

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

  static updateMapel = async (req, res) => {
    try {
      const { id, idkur } = req.params;
      const { kode, nama, kkm_1, kkm_2, kkm_3, keterangan, sifat } = req.body;

      // Check if mapel exists
      const existingMapel = await prisma.ref_mapel.findFirst({
        where: {
          id: parseInt(id),
          id_kurikulum: parseInt(idkur)
        }
      });

      if (!existingMapel) {
        return res.status(404).json({
          success: false,
          message: "Subject not found"
        });
      }

      // If code is being updated, check if it already exists
      if (kode && kode !== existingMapel.kode) {
        const kodeExists = await prisma.ref_mapel.findFirst({
          where: {
            kode,
            keterangan,
            id_kurikulum: parseInt(idkur),
            NOT: {
              id: parseInt(id)
            }
          }
        });

        if (kodeExists) {
          return res.status(400).json({
            success: false,
            message: "Subject code already exists in this curriculum"
          });
        }
      }

      const updatedMapel = await prisma.ref_mapel.update({
        where: { id: parseInt(id) },
        data: {
          kode,
          nama,
          kkm_1,
          kkm_2,
          kkm_3,
          keterangan,
          sifat
        }
      });

      res.json({
        success: true,
        data: updatedMapel
      });
    } catch (error) {
      console.error("Error updating mapel:", error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  static deleteMapel = async (req, res) => {
    try {
      const { id, idkur } = req.params;

      // Check if mapel exists
      const existingMapel = await prisma.ref_mapel.findFirst({
        where: {
          id: parseInt(id),
          id_kurikulum: parseInt(idkur)
        }
      });

      if (!existingMapel) {
        return res.status(404).json({
          success: false,
          message: "Subject not found"
        });
      }

      await prisma.ref_mapel.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        message: "Subject deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting mapel:", error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
}