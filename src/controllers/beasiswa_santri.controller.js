import { AppError } from "../middleware/errorHandler.js";
import { prisma } from "../prisma.js";

export class BeasiswaSantriController {
    static getBeasiswaSantri = async (req, res, next) => {
        try {
            const beasiswa_santri = await prisma.data_beasiswa_santri.findMany();

            return res.status(200).json({
                success: true,
                message: "beasiswa santri berhasil diambil",
                data: beasiswa_santri
            });

            
        }catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    static createBeasiswaSantri = async (req, res, next) => {
        try{
            const {id_santri, id_jenis_beasiswa, status, keterangan} = req.body;

            if (!id_santri || typeof id_santri!=='number') {
                return next(new AppError("id santri harus diisi", 400));
            }

            if (!id_jenis_beasiswa || typeof id_jenis_beasiswa!=='number') {
                return next(new AppError("id jenis beasiswa harus diisi", 400));
            }

            if (!status || typeof status!=='boolean') {
                return next(new AppError("status harus diisi", 400));
            }

            if (!keterangan || typeof keterangan!=='string') {
                return next(new AppError("keterangan harus diisi", 400));
            }

            const santri = await prisma.data_santri.findUnique({
                where: {
                    id: id_santri
                }
            })

            if (!santri) {
                return next(new AppError("santri tidak ditemukan", 404));
            }

            const jenis_beasiswa = await prisma.ref_jenis_beasiswa.findUnique({
                where: {
                    id: id_jenis_beasiswa
                }
            })
            if (!jenis_beasiswa) {
                return next(new AppError("jenis beasiswa tidak ditemukan", 404));
            }

            const beasiswa_santri = await prisma.data_beasiswa_santri.create({
                data: {
                    id_santri,
                    id_jenis_beasiswa,
                    status,
                    keterangan
                }
            })

            return res.status(200).json({
                success: true,
                message: "beasiswa santri berhasil ditambahkan",
                data: beasiswa_santri
            })
        }catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    static updateBeasiswaSantri = async (req, res, next) => {
        try{
            const {id} = req.params;
            const {id_santri, id_jenis_beasiswa, status, keterangan} = req.body;

            if (!id || typeof id!=='number') {
                return next(new AppError("id harus diisi", 400));
            }
            if (!id_santri || typeof id_santri!=='number') {
                return next(new AppError("id santri harus diisi", 400));
            }

            if (!id_jenis_beasiswa || typeof id_jenis_beasiswa!=='number') {
                return next(new AppError("id jenis beasiswa harus diisi", 400));
            }

            if (!status || typeof status!=='boolean') {
                return next(new AppError("status harus diisi", 400));
            }

            if (!keterangan || typeof keterangan!=='string') {
                return next(new AppError("keterangan harus diisi", 400));
            }

            const santri = await prisma.data_santri.findUnique({
                where: {
                    id: id_santri
                }
            })

            if (!santri) {
                return next(new AppError("santri tidak ditemukan", 404));
            }

            const jenis_beasiswa = await prisma.ref_jenis_beasiswa.findUnique({
                where: {
                    id: id_jenis_beasiswa
                }
            })
            if (!jenis_beasiswa) {
                return next(new AppError("jenis beasiswa tidak ditemukan", 404));
            }

            const beasiswa_santri = await prisma.data_beasiswa_santri.update({
                where: {
                    id: parseInt(id)
                },
                data: {
                    id_santri,
                    id_jenis_beasiswa,
                    status,
                    keterangan
                }
            })
            return res.status(200).json({
                success: true,
                message: "beasiswa santri berhasil diupdate",
                data: beasiswa_santri
            })
        }catch (error) {
            next(new AppError(error.message, 500));
        }   
    }

    static deleteBeasiswaSantri = async (req, res, next) => {
        try{
            const {id} = req.params;

            if (!id || typeof id!=='number') {
                return next(new AppError("id harus diisi", 400));
            }

            const beasiswa_santri = await prisma.data_beasiswa_santri.delete({
                where: {
                    id: parseInt(id)
                }
            })
            return res.status(200).json({
                success: true,
                message: "beasiswa santri berhasil dihapus",
                data: beasiswa_santri
            })
        }catch (error) {
            next(new AppError(error.message, 500));
        }
    }

}