import { prisma } from '../prisma.js';
import { getTokenPayload } from "../helpers.js";

export class KomponenController {
    static async getAllKomponen(req, res, next) {
        try {
            const komponen = await prisma.ref_komponen_nilai.findMany({
                orderBy: {
                    nama: 'asc',
                },
            });

            res.status(200).json(komponen);
        } catch (error) {
            next(error);
        }
    }

    static async getKomponenById(req, res, next) {
        try {
            const { id } = req.params;

            const komponen = await prisma.ref_komponen_nilai.findFirst({
                where: {
                    id: parseInt(id),
                }
            });

            res.status(200).json(komponen);

        } catch (error) {
            next(error);
        }
    }

    static async createKomponen(req, res, next) {
        try {
            const { nama, keterangan } = req.body;

            // 1. Input validation
            if (!nama) {
                return res.status(400).json({
                    message: 'Nama wajib diisi',
                });
            }

            if (typeof nama !== 'string' || nama.length > 50) {
                return res.status(400).json({
                    message: 'Nama harus berupa string dengan panjang maksimum 50 karakter',
                });
            }

            if (keterangan !== undefined && typeof keterangan !== 'string') {
                return res.status(400).json({
                    message: 'Keterangan harus berupa string jika diisi',
                });
            }

            // 2. Check for duplicate nama
            const duplicateKomponen = await prisma.ref_komponen_nilai.findFirst({
                where: {
                    nama,
                },
            });

            if (duplicateKomponen) {
                return res.status(400).json({
                    message: 'Komponen dengan nama yang sama sudah ada',
                });
            }

            // 3. Create komponen
            const newKomponen = await prisma.ref_komponen_nilai.create({
                data: {
                    nama,
                    keterangan: keterangan !== undefined ? keterangan : null,
                },
            });

            // 4. Success response
            res.status(201).json({
                message: 'Komponen berhasil ditambahkan',
                data: newKomponen,
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateKomponen(req, res, next) {
        try {
            const { id } = req.params;
            const { nama, keterangan } = req.body;

            // 1. Input validation
            const parsedId = parseInt(id);
            if (isNaN(parsedId)) {
                return res.status(400).json({
                    message: 'ID komponen tidak valid',
                });
            }

            if (nama !== undefined) {
                if (typeof nama !== 'string' || nama.length > 50) {
                    return res.status(400).json({
                        message: 'Nama harus berupa string dengan panjang maksimum 50 karakter',
                    });
                }
            }

            if (keterangan !== undefined && typeof keterangan !== 'string') {
                return res.status(400).json({
                    message: 'Keterangan harus berupa string jika diisi',
                });
            }

            // 2. Check if komponen exists
            const existingKomponen = await prisma.ref_komponen_nilai.findUnique({
                where: { id: parsedId },
            });

            if (!existingKomponen) {
                return res.status(404).json({
                    message: 'Komponen tidak ditemukan',
                });
            }

            // 3. Check for duplicate nama
            if (nama !== undefined) {
                const duplicateKomponen = await prisma.ref_komponen_nilai.findFirst({
                    where: {
                        nama,
                        NOT: { id: parsedId },
                    },
                });

                if (duplicateKomponen) {
                    return res.status(400).json({
                        message: 'Komponen dengan nama yang sama sudah ada',
                    });
                }
            }

            // 4. Prepare update data
            const updateData = {
                nama: nama !== undefined ? nama : existingKomponen.nama,
                keterangan: keterangan !== undefined ? keterangan : existingKomponen.keterangan,
            };

            // 5. Update komponen
            const updatedKomponen = await prisma.ref_komponen_nilai.update({
                where: { id: parsedId },
                data: updateData,
            });

            // 6. Success response
            res.status(200).json({
                message: 'Komponen berhasil diperbarui',
                data: updatedKomponen,
            });
        } catch (error) {
            next(error);
        }
    }

    static async deleteKomponen(req, res, next) {
        try {
            const { id } = req.params;

            // 1. Input validation
            const parsedId = parseInt(id);
            if (isNaN(parsedId)) {
                return res.status(400).json({
                    message: 'ID komponen tidak valid',
                });
            }

            // 2. Check if komponen exists
            const existingKomponen = await prisma.ref_komponen_nilai.findUnique({
                where: { id: parsedId },
            });

            if (!existingKomponen) {
                return res.status(404).json({
                    message: 'Komponen tidak ditemukan',
                });
            }

            // 4. Delete komponen
            await prisma.ref_komponen_nilai.delete({
                where: { id: parsedId },
            });

            // 5. Success response
            res.status(200).json({
                message: 'Komponen berhasil dihapus',
            });
        } catch (error) {
            next(error);
        }
    }
}