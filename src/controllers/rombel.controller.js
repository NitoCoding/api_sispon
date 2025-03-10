import { prisma } from '../prisma.js';

// Get all data_rombel
export const getAllRombel = async (req, res, next) => {
    try {
        const rombels = await prisma.data_rombel.findMany();
        res.status(200).json(rombels);
    } catch (error) {
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
            status } = req.body;
        const newRombel = await prisma.data_rombel.create({
            data: {
                id_kelas,
                id_tahun_ajaran,
                id_wali_kelas,
                nama,
                status
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
