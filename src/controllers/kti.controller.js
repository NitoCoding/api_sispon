import { prisma } from '../prisma.js';

// Get all KTI data
export const getAllKti = async (req, res, next) => {
    try {
        const ktiData = await prisma.data_nilai_kti.findMany();
        res.status(200).json(ktiData);
    } catch (error) {
        next(error);
    }
};

// Get single KTI data by ID
export const getKtiById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const kti = await prisma.data_nilai_kti.findUnique({
            where: { id: parseInt(id) }
        });
        if (!kti) return res.status(404).json({ message: "KTI data not found" });
        res.status(200).json(kti);
    } catch (error) {
        next(error);
    }
};

// Create new KTI data
export const createKti = async (req, res, next) => {
    try {
        const {
            id_santri,
            id_tahun_ajaran,
            id_semester,
            nilai,
            judul
        } = req.body;

        const newKti = await prisma.data_nilai_kti.create({
            data: {
                id_santri,
                id_tahun_ajaran,
                id_semester,
                nilai,
                judul
            }
        });
        res.status(201).json(newKti);
    } catch (error) {
        next(error);
    }
};

// Update KTI data by ID
export const updateKti = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            id_santri,
            id_tahun_ajaran,
            id_semester,
            nilai,
            judul
        } = req.body;

        const updatedKti = await prisma.data_nilai_kti.update({
            where: { id: parseInt(id) },
            data: {
                id_santri,
                id_tahun_ajaran,
                id_semester,
                nilai,
                judul
            }
        });
        res.status(200).json(updatedKti);
    } catch (error) {
        next(error);
    }
};

// Delete KTI data by ID
export const deleteKti = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.data_nilai_kti.delete({
            where: { id: parseInt(id) }
        });
        res.status(200).json({ message: "KTI data deleted successfully" });
    } catch (error) {
        next(error);
    }
};

// Batch create KTI data for multiple students
export const batchCreateKti = async (req, res, next) => {
    try {
        const { id_santri_array, id_tahun_ajaran, id_semester, nilai, judul } = req.body;

        if (!Array.isArray(id_santri_array) || id_santri_array.length === 0) {
            return res.status(400).json({ message: "Invalid or empty student ID array" });
        }

        const ktiData = await prisma.$transaction(
            id_santri_array.map(id_santri => {
                return prisma.data_nilai_kti.create({
                    data: {
                        id_santri,
                        id_tahun_ajaran,
                        id_semester,
                        nilai,
                        judul
                    }
                });
            })
        );

        res.status(201).json({
            message: "Batch KTI data creation successful",
            data: ktiData
        });
    } catch (error) {
        next(error);
    }
};