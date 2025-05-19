import { AppError } from "../middleware/errorHandler.js";
import { JWTService } from "../services/jwt.service.js";
import { encrypt, decrypt, trimmedString } from "../helpers.js";
import { prisma } from "../prisma.js";
import { get } from "mongoose";
import { EjsHelpers } from "../ejs_helpers.js";
import { ref_master_kategori_tipe } from "@prisma/client";
// import { tipe_master_kategori } from "@prisma/client";

export class MasterKategoriController {
    static allowedTypes = Object.values(ref_master_kategori_tipe);

    static createMasterKategori = async (req, res, next) => {
        try{


            const {nama, tipe} = req.body;

            if (!tipe || typeof tipe !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: "tipe tidak boleh kosong"
                });
            }

            if (!MasterKategoriController.allowedTypes.includes(tipe)) {
                return res.status(400).json({
                    success: false,
                    message: "tipe tidak valid"
                });
            }

            const existingKategori = await prisma.ref_master_kategori.findFirst({
                where: {
                    nama: trimmedString(nama),
                    tipe: tipe
                }
            });

            if (existingKategori) {
                return res.status(400).json({
                    success: false,
                    message: "kategori sudah ada"
                });
            }

            const newKategori = await prisma.ref_master_kategori.create({
                data: {
                    nama: trimmedString(nama),
                    tipe: tipe
                }
            });

            return res.status(201).json({
                success: true,
                message: "kategori berhasil dibuat",
                data: newKategori
            });


        }catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    static getAllMasterKategori = async (req, res, next) => {
        try {
            const { tipe } = req.query;

            if (tipe && !MasterKategoriController.allowedTypes.includes(tipe)) {
                return res.status(400).json({
                    success: false,
                    message: "tipe tidak valid"
                });
            }

            const masterKategoris = await prisma.ref_master_kategori.findMany({
                where: {
                    ...(tipe && { tipe })
                },
                orderBy: {
                    tipe: 'asc'
                }
            });

            return res.status(200).json({
                success: true,
                message: "berhasil mendapatkan semua kategori",
                data: masterKategoris
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    static getUniqueTipe = async (req, res, next) => {
        res.status(200).json({
            success: true,
            message: "berhasil mendapatkan semua kategori",
            data: MasterKategoriController.allowedTypes
        });
    }

    static getMasterKategoriById = async (req, res, next) => {
        try {
            const { id } = req.params;

            const masterKategori = await prisma.ref_master_kategori.findUnique({
                where: {
                    id: parseInt(id)
                }
            });

            if (!masterKategori) {
                return res.status(404).json({
                    success: false,
                    message: "kategori tidak ditemukan"
                });
            }

            return res.status(200).json({
                success: true,
                message: "berhasil mendapatkan kategori",
                data: masterKategori
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    static updateMasterKategori = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { nama, tipe } = req.body;

            if (!tipe || typeof tipe !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: "tipe tidak boleh kosong"
                });
            }

            if (!MasterKategoriController.allowedTypes.includes(tipe)) {
                return res.status(400).json({
                    success: false,
                    message: "tipe tidak valid"
                });
            }

            const existingKategori = await prisma.ref_master_kategori.findFirst({
                where: {
                    id: parseInt(id)
                }
            });

            if (!existingKategori) {
                return res.status(404).json({
                    success: false,
                    message: "kategori tidak ditemukan"
                });
            }

            const updatedKategori = await prisma.ref_master_kategori.update({
                where: {
                    id: parseInt(id)
                },
                data: {
                    nama: trimmedString(nama),
                    tipe: tipe
                }
            });

            return res.status(200).json({
                success: true,
                message: "kategori berhasil diperbarui",
                data: updatedKategori
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    static deleteMasterKategori = async (req, res, next) => {
        try {
            const { id } = req.params;

            const existingKategori = await prisma.ref_master_kategori.findFirst({
                where: {
                    id: parseInt(id)
                }
            });

            if (!existingKategori) {
                return res.status(404).json({
                    success: false,
                    message: "kategori tidak ditemukan"
                });
            }

            await prisma.ref_master_kategori.delete({
                where: {
                    id: parseInt(id)
                }
            });

            return res.status(200).json({
                success: true,
                message: "kategori berhasil dihapus"
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }
}