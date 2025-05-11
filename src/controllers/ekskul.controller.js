import { prisma } from "../prisma.js";

export class EkskulController {
    static createEkskul = async (req, res) => {
        try {
            const { kode, nama, kkm_1, kkm_2, kkm_3, keterangan, id_kurikulum, id_master_kategori } = req.body;

            // Validasi input
            if (!kode || !nama || !id_master_kategori) {
                return res.status(400).json({ message: "Kode, nama, dan kategori wajib diisi" });
            }

            // Cek duplikasi kode
            const existingKode = await prisma.ref_mapel.findFirst({
                where: { kode }
            });
            if (existingKode) {
                return res.status(400).json({ message: "Kode mapel sudah digunakan" });
            }

            // Cek duplikasi nama pada kurikulum yang sama
            const existingNama = await prisma.ref_mapel.findFirst({
                where: {
                    nama,
                    id_kurikulum
                }
            });
            if (existingNama) {
                return res.status(400).json({ message: "Nama mapel sudah ada untuk kurikulum ini" });
            }

            const mapel = await prisma.ref_mapel.create({
                data: {
                    kode,
                    nama,
                    kkm_1: kkm_1 ? parseInt(kkm_1) : null,
                    kkm_2: kkm_2 ? parseInt(kkm_2) : null,
                    kkm_3: kkm_3 ? parseInt(kkm_3) : null,
                    keterangan,
                    id_kurikulum: parseInt(id_kurikulum),
                    id_master_kategori: parseInt(id_master_kategori)
                }
            });

            res.status(201).json(mapel);
        } catch (error) {
            next(error);
        }
    };

    static getAllEkskul = async (req, res) => {
        try {
            const { ekskul_master_ids } = await prisma.ref_master_kategori.findMany({
                where: {
                    tipe: "ekskul"
                }
            });
            const mapels = await prisma.ref_mapel.findMany({
                where: {
                    id_master_kategori: {
                        in: ekskul_master_ids
                    }
                },
                include: {
                    ref_master_kategori: true,
                },
                orderBy: { id: 'asc' }
            });

            res.status(200).json(mapels);
        } catch (error) {
            next(error);
        }
    };

    static getEkskulById = async (req, res) => {
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

    static updateEkskul = async (req, res) => {
        try {
            const { id } = req.params;
            const { kode, nama, kkm_1, kkm_2, kkm_3, keterangan, id_kurikulum, id_master_kategori } = req.body;

            // Cek apakah mapel ada
            const mapel = await prisma.ref_mapel.findUnique({
                where: { id: parseInt(id) }
            });
            if (!mapel) {
                return res.status(404).json({ message: "Mapel tidak ditemukan" });
            }

            // Cek duplikasi kode
            if (kode && kode !== mapel.kode) {
                const existingKode = await prisma.ref_mapel.findFirst({
                    where: {
                        kode,
                        id: { not: parseInt(id) }
                    }
                });
                if (existingKode) {
                    return res.status(400).json({ message: "Kode mapel sudah digunakan" });
                }
            }

            // Cek duplikasi nama pada kurikulum yang sama
            if (nama && id_kurikulum && (nama !== mapel.nama || parseInt(id_kurikulum) !== mapel.id_kurikulum)) {
                const existingNama = await prisma.ref_mapel.findFirst({
                    where: {
                        nama,
                        id_kurikulum: parseInt(id_kurikulum),
                        id: { not: parseInt(id) }
                    }
                });
                if (existingNama) {
                    return res.status(400).json({ message: "Nama mapel sudah ada untuk kurikulum ini" });
                }
            }

            const updatedMapel = await prisma.ref_mapel.update({
                where: { id: parseInt(id) },
                data: {
                    kode: kode || mapel.kode,
                    nama: nama || mapel.nama,
                    kkm_1: kkm_1 !== undefined ? parseInt(kkm_1) : mapel.kkm_1,
                    kkm_2: kkm_2 !== undefined ? parseInt(kkm_2) : mapel.kkm_2,
                    kkm_3: kkm_3 !== undefined ? parseInt(kkm_3) : mapel.kkm_3,
                    keterangan: keterangan !== undefined ? keterangan : mapel.keterangan,
                    id_kurikulum: id_kurikulum ? parseInt(id_kurikulum) : mapel.id_kurikulum,
                    id_master_kategori: id_master_kategori ? parseInt(id_master_kategori) : mapel.id_master_kategori
                }
            });

            res.status(200).json(updatedMapel);
        } catch (error) {
            next(error);
        }
    };

    static deleteEkskul = async (req, res) => {
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