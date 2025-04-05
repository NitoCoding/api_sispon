import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../prisma.js';

export class TaController {


static getAllTahunAjaran = async (req, res) => {
  try {
    const tahunAjaran = await prisma.ref_tahun_ajaran.findMany({
      orderBy: {
        tahun_mulai: 'desc'
      }
    });
    res.status(200).json(tahunAjaran);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

static getTahunAjaranById = async (req, res) => {
  try {
    const { id } = req.params;
    const tahunAjaran = await prisma.ref_tahun_ajaran.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!tahunAjaran) {
      return res.status(404).json({
        status: 'error',
        message: 'Tahun ajaran tidak ditemukan'
      });
    }

    res.json({
      status: 'success',
      data: tahunAjaran
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

static createTahunAjaran = async (req, res) => {
  try {
    const { tahun_mulai, tahun_selesai, status } = req.body;
    const nama = `${tahun_mulai}/${tahun_selesai}`;

    // Validate year range
    if (tahun_selesai <= tahun_mulai) {
      return res.status(400).json({
        status: 'error',
        message: 'Tahun selesai harus lebih besar dari tahun mulai'
      });
    }

    // Check for overlapping years
    const existingTahunAjaran = await prisma.ref_tahun_ajaran.findFirst({
      where: {
        nama,
      }
    });

    if (existingTahunAjaran) {
      console.log(existingTahunAjaran);
      return res.status(400).json({
        status: 'error',
        message: 'Terdapat overlap dengan tahun ajaran yang sudah ada'
      });
    }

    const tahunAjaran = await prisma.ref_tahun_ajaran.create({
      data: {
        nama,
        tahun_mulai,
        tahun_selesai,
        status: status || 'aktif'
      }
    });

    res.status(201).json(tahunAjaran);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

static updateTahunAjaran = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, tahun_mulai, tahun_selesai, status } = req.body;

    // Check if tahun ajaran exists
    const existingTahunAjaran = await prisma.ref_tahun_ajaran.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTahunAjaran) {
      return res.status(404).json({
        status: 'error',
        message: 'Tahun ajaran tidak ditemukan'
      });
    }

    // Validate year range if provided
    if (tahun_mulai && tahun_selesai && tahun_selesai <= tahun_mulai) {
      return res.status(400).json({
        status: 'error',
        message: 'Tahun selesai harus lebih besar dari tahun mulai'
      });
    }

    // Check for overlapping years excluding current record
    if (tahun_mulai || tahun_selesai) {
      const overlapCheck = await prisma.ref_tahun_ajaran.findFirst({
        where: {
          AND: [
            { id: { not: parseInt(id) } },
            {
              OR: [
                {
                  AND: [
                    { tahun_mulai: { lte: tahun_mulai || existingTahunAjaran.tahun_mulai } },
                    { tahun_selesai: { gte: tahun_mulai || existingTahunAjaran.tahun_mulai } }
                  ]
                },
                {
                  AND: [
                    { tahun_mulai: { lte: tahun_selesai || existingTahunAjaran.tahun_selesai } },
                    { tahun_selesai: { gte: tahun_selesai || existingTahunAjaran.tahun_selesai } }
                  ]
                }
              ]
            }
          ]
        }
      });

      if (overlapCheck) {
        return res.status(400).json({
          status: 'error',
          message: 'Terdapat overlap dengan tahun ajaran yang sudah ada'
        });
      }
    }

    const updatedTahunAjaran = await prisma.ref_tahun_ajaran.update({
      where: { id: parseInt(id) },
      data: {
        nama: nama || undefined,
        tahun_mulai: tahun_mulai || undefined,
        tahun_selesai: tahun_selesai || undefined,
        status: status || undefined
      }
    });

    res.json({
      status: 'success',
      data: updatedTahunAjaran
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

static deleteTahunAjaran = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tahun ajaran exists
    const tahunAjaran = await prisma.ref_tahun_ajaran.findUnique({
      where: { id: parseInt(id) },
      include: {
        ref_semester: true
      }
    });

    if (!tahunAjaran) {
      return res.status(404).json({
        status: 'error',
        message: 'Tahun ajaran tidak ditemukan'
      });
    }

    // Check for related data
    if (tahunAjaran.ref_semester.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Tidak dapat menghapus tahun ajaran yang memiliki data semester terkait'
      });
    }

    await prisma.ref_tahun_ajaran.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      status: 'success',
      message: 'Tahun ajaran berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

}