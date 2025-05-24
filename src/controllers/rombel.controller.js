
import { prisma } from '../prisma.js';
import {JWTService} from "../services/jwt.service.js";
import {getTokenPayload} from "../helpers.js";

// Get all data_rombel
export const getAllRombel = async (req, res, next) => {
    try {
        const { decoded, semester, tahunAjaran } = await getTokenPayload(req);
        
        const rombels = await prisma.data_rombel.findMany(
            {
                where: {
                    id_tahun_ajaran: semester.id_tahun_ajaran,
                },
                include: { 
                    ref_master_kategori: true,
                    ref_kelas:true
                },
                orderBy: [
                    {
                        ref_kelas: {
                            id_tingkat: 'asc'
                        }
                    },
                    {
                        ref_kelas: {
                            urutan: 'asc'
                        }
                    }
                ]
            }
        );

        const mappedRombels = rombels.map((rombels) => {
            const { nama, ref_master_kategori, ref_kelas,  ...rest } = rombels;
            return {
                ...rest,
                status: ref_master_kategori.nama,
                kelas: ref_kelas.kelas,
            };
        });

        res.status(200).json(mappedRombels);
    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const getAllWaliKelasRombel = async (req, res, next) => {
    try {
        const { decoded, semester, tahunAjaran } = await getTokenPayload(req);

        const rombels = await prisma.data_rombel.findMany(
            {
                where: {
                    id_tahun_ajaran: semester.id_tahun_ajaran,
                    NOT: {
                        id_wali_kelas: null
                    }
                },
                include: {
                    ref_master_kategori: true,
                    ref_kelas: true,
                    guru_pegawai: true,
                    ref_tahun_ajaran: true,
                },
                orderBy: [
                    {
                        ref_kelas: {
                            id_tingkat: 'asc'
                        }
                    },
                    {
                        ref_kelas: {
                            urutan: 'asc'
                        }
                    }
                ]
            }
        );

        const mappedRombels = rombels.map((rombels) => {
            const { nama, ref_master_kategori, ref_kelas, guru_pegawai, ref_tahun_ajaran,  ...rest } = rombels;
            return {
                ...rest,
                kelas: ref_kelas.kelas,
                wali_kelas: guru_pegawai.nama_gp,
                tahun_ajaran: ref_tahun_ajaran.nama,
                foto_ttd: guru_pegawai.foto_ttd,
            };
        });

        res.status(200).json(mappedRombels);
    } catch (error) {
        console.log(error);
        next(error);
    }
};

// Get single data_rombel by ID
export const getRombelById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const rombel = await prisma.data_rombel.findUnique({
            where: { id: parseInt(id) }
        });
        if (!rombel) return res.status(404).json({ message: "Rombel not found" });
        res.status(200).json(rombel);
    } catch (error) {
        next(error);
    }
};

// Create new data_rombel
export const createRombel = async (req, res, next) => {
    try {
        const {
            id_kelas,
            id_tahun_ajaran,
            id_wali_kelas
        } = req.body;

        const newRombel = await prisma.data_rombel.create({
            data: {
                id_kelas,
                id_tahun_ajaran,
                id_wali_kelas,
                id_status: 13
            }
        });
        res.status(201).json(newRombel);
    } catch (error) {
        next(error);
    }
};

// Update data_rombel by ID
export const updateRombel = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            id_kelas,
            id_tahun_ajaran,
            id_wali_kelas,
            id_status
        } = req.body;

        const updatedRombel = await prisma.data_rombel.update({
            where: { id: parseInt(id) },
            data: {
                id_kelas,
                id_tahun_ajaran,
                id_wali_kelas,
                id_status
            }
        });
        res.status(200).json(updatedRombel);
    } catch (error) {
        next(error);
    }
};

export const updateWaliKelas = async (req, res, next) => {
    try {
        // Parse request body
        const { id, id_wali_kelas } = JSON.parse(req.body.data);

        // Validate inputs
        if (!id || !id_wali_kelas) {
            return res.status(400).json({ message: "Kolom wajib diisi" });
        }
        if (isNaN(parseInt(id)) || isNaN(parseInt(id_wali_kelas))) {
            return res.status(400).json({ message: "Isian tidak valid" });
        }

        // Handle file upload for foto_ttd
        const foto_ttd = req.file ? `/uploads/ttd_gp/${req.file.filename}` : null;

        // Perform updates within a transaction
        const [updatedRombel, updatedWaliKelas] = await prisma.$transaction([
            prisma.data_rombel.update({
                where: { id: parseInt(id) },
                data: {
                    id_wali_kelas: parseInt(id_wali_kelas),
                },
            }),
            prisma.guru_pegawai.update({
                where: { id: parseInt(id_wali_kelas) },
                data: {
                    foto_ttd,
                },
            }),
        ]);

        // Return the updated rombel
        res.status(200).json(updatedRombel);
    } catch (error) {
        next(error);
    }
};


// Delete data_rombel by ID
export const deleteRombel = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.data_rombel.delete({
            where: { id: parseInt(id) }
        });
        res.status(200).json({ message: "Rombel deleted successfully" });
    } catch (error) {
        next(error);
    }
};

