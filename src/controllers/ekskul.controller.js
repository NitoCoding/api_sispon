import { prisma } from "../prisma.js";

/*
Master Kategori Ref Ekskul:
1. Akademik
2. Non Akademik
 */

export class EkskulController {
    static createEkskul = async (req, res, next) => {
        try {
            const data = req.body;

            // Validasi input
            if (!data.kode || !data.nama || !data.id_master_kategori_ref_mapel) {
                return res.status(400).json({ message: "Kode, nama, dan kategori wajib diisi" });
            }

            // Cek duplikasi kode
            const existingKode = await prisma.ref_mapel.findFirst({
                where: { kode: data.kode }
            });
            if (existingKode) {
                return res.status(400).json({ message: "Kode mapel sudah digunakan" });
            }

            // Tambahkan jenis_nilai dengan value "Huruf"
            const mapelData = {
                ...data,
                jenis_nilai: "Huruf"
            };

            const mapel = await prisma.ref_mapel.create({
                data: mapelData
            });

            res.status(201).json({
                message: "Ekskul berhasil dibuat",
                data: mapel
            });
        } catch (error) {
            next(error);
        }
    };

    static getAllEkskul = async (req, res, next) => {
        try {
            const { cat } = req.query;

            const ekskulCategories = await prisma.ref_master_kategori.findMany({
                where: {
                    tipe: "ekskul",
                },
                select: {
                    id: true,
                },
            });

            const ekskul_master_ids = ekskulCategories.map((category) => category.id);

            let whereClause = {
                id_master_kategori_ref_mapel: {
                    in: ekskul_master_ids,
                },
            };

            if (cat) {
                if (isNaN(parseInt(cat))) {
                    return res.status(400).json({ message: "Kategori harus berupa angka" });
                }
                whereClause = {
                    ...whereClause,
                    id_master_kategori_ref_mapel: parseInt(cat),
                };
            }

            const mapels = await prisma.ref_mapel.findMany({
                where: whereClause,
                orderBy: { id: "asc" },
                include: {
                    ref_master_kategori_ref_mapel: true
                }
            });

            const flattenedMapels = mapels.map((mapel) => {
                const { ref_master_kategori_ref_mapel, ...rest } = mapel;
                return {
                    ...rest,
                    tipe: ref_master_kategori_ref_mapel.nama,
                };
            });

            res.status(200).json(flattenedMapels);
        } catch (error) {
            console.error(error); // Log error untuk debugging
            next(error);
        }
    };

    static getEkskulById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const mapel = await prisma.ref_mapel.findUnique({
                where: { id: parseInt(id) }
            });

            if (!mapel) {
                return res.status(404).json({ message: "Mapel tidak ditemukan" });
            }

            res.status(200).json(mapel);
        } catch (error) {
            next(error);
        }
    };

    static getEkskulTipe = async (req, res, next) => {
        try {
            const kategori = await prisma.ref_master_kategori.findMany({
                where: {
                    tipe: "ekskul"
                },
                orderBy: {
                    nama: "asc"
                }
            });
            res.status(200).json(kategori);
        } catch (error) {
            next(error);
        }
    }

    static updateEkskul = async (req, res, next) => {
        try {
            const { id_mapel } = req.params;
            const { kode, nama, keterangan, id_kurikulum, id_master_kategori_ref_mapel, nama_arab, sifat, id_pengajar } = req.body;

            // Validasi id_mapel
            if (!id_mapel || isNaN(parseInt(id_mapel))) {
                return res.status(400).json({ message: 'ID mapel tidak valid' });
            }

            // Cek apakah mapel ada
            const existingMapel = await prisma.ref_mapel.findUnique({
                where: { id: parseInt(id_mapel) },
            });

            if (!existingMapel) {
                return res.status(404).json({ message: 'Mapel tidak ditemukan' });
            }

            // Cek apakah kode sudah digunakan (kecuali untuk mapel yang sama)
            if (kode) {
                const duplicateKode = await prisma.ref_mapel.findFirst({
                    where: {
                        kode,
                        keterangan: keterangan || existingMapel.keterangan,
                        id: { not: parseInt(id_mapel) }, // Kecualikan mapel yang sedang diupdate
                    },
                });

                if (duplicateKode) {
                    return res.status(400).json({ message: 'Kode dan keterangan sudah digunakan oleh mapel lain' });
                }
            }

            // Siapkan data untuk update
            const updateData = {
                kode,
                nama: nama || undefined,
                keterangan: keterangan || undefined,
                id_kurikulum: id_kurikulum ? parseInt(id_kurikulum) : undefined,
                id_master_kategori_ref_mapel: id_master_kategori_ref_mapel ? parseInt(id_master_kategori_ref_mapel) : undefined,
                nama_arab: nama_arab || undefined,
                sifat: sifat || undefined,
                id_pengajar: id_pengajar ? parseInt(id_pengajar) : undefined,
            };

            // Update mapel
            const updatedMapel = await prisma.ref_mapel.update({
                where: { id: parseInt(id_mapel) },
                data: updateData,
            });

            res.json({
                message: 'Ekskul berhasil diperbarui',
                data: updatedMapel,
            });
        } catch (error) {
            if (error.name === 'PrismaClientValidationError') {
                return res.status(400).json({ message: 'Data input tidak valid', error: error.message });
            }
            next(error);
        }
    };

    static deleteEkskul = async (req, res, next) => {
        try {
            const { id } = req.params;

            // Cek apakah mapel ada
            const mapel = await prisma.ref_mapel.findUnique({
                where: { id: parseInt(id) }
            });
            if (!mapel) {
                return res.status(404).json({ message: "Mapel tidak ditemukan" });
            }

            await prisma.ref_mapel.delete({
                where: { id: parseInt(id) }
            });

            res.status(200).json({
                message: "Mapel berhasil dihapus"
            });
        } catch (error) {
            next(error);
        }
    };
}