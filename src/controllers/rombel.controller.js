
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
                    ref_master_kategori_data_rombel: true,
                    ref_kelas:true
                }
            }
        );

        const mappedRombels = rombels.map((rombels) => {
            const { nama, ref_master_kategori_data_rombel, ref_kelas,  ...rest } = rombels;
            return {
                ...rest,
                status: ref_master_kategori_data_rombel.nama,
                kelas: ref_kelas.kelas,
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
            id_wali_kelas,
            nama,
            id_master_kategori_data_rombel } = req.body;
        const newRombel = await prisma.data_rombel.create({
            data: {
                id_kelas,
                id_tahun_ajaran,
                id_wali_kelas,
                nama,
                id_master_kategori_data_rombel
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
            nama,
            status } = req.body;
        const updatedRombel = await prisma.data_rombel.update({
            where: { id: parseInt(id) },
            data: {
                id_kelas,
                id_tahun_ajaran,
                id_wali_kelas,
                nama,
                status
            }
        });
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

