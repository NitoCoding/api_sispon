import { prisma } from "../prisma.js";
import {JWTService} from "../services/jwt.service.js";
import {getTokenPayload} from "../helpers.js";

export class EkskulSantriController {
    static createEkskulSantri = async (req, res) => {
        try {
            const { id_santri, id_mapel, tgl_masuk, tgl_keluar } = req.body;

            // Validasi input
            if (!id_santri || !id_mapel) {
                return res.status(400).json({
                    status: 'error',
                    message: 'id_santri dan id_mapel wajib diisi',
                });
            }

            // Buat data ekskul santri baru
            const newEkskulSantri = await prisma.data_eskul.create({
                data: {
                    id_santri: parseInt(id_santri),
                    id_mapel: parseInt(id_mapel),
                    tgl_masuk: tgl_masuk ? new Date(tgl_masuk) : null,
                    tgl_keluar: tgl_keluar ? new Date(tgl_keluar) : null,
                },
            });

            // Respon sukses
            return res.status(201).json(newEkskulSantri);
        } catch (error) {
            console.error('Error creating ekskul santri:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan pada server',
            });
        }
    };

    static getAllEkskulSantri = async (req, res, next) => {
        try {
            const { groupbyclass, class: className } = req.query;
            const { decoded, semester, tahunAjaran } = await getTokenPayload(req);

            const whereClause = { id_tahun_ajaran: tahunAjaran.id };
            if (className) {
                whereClause["nama"] = className;
            }

            // Fetch rombel data with members
            const rombels = await prisma.data_rombel.findMany({
                where: whereClause,
                include: {
                    data_rombel_anggota: {
                        select: {
                            id_santri: true
                        }
                    }
                }
            });

            let santriData = [];

            for (const rombel of rombels) {
                const anggotaIds = rombel.data_rombel_anggota.map(anggota => anggota.id_santri);

                // Fetch santri data for members
                const santriList = await prisma.santri.findMany({
                    where: { id: { in: anggotaIds } },
                    select: { id: true, nis: true, nama: true }
                });

                // Create a map of santri ID to santri data
                const santriMap = santriList.reduce((acc, santri) => {
                    acc[santri.id] = santri;
                    return acc;
                }, {});

                // Fetch extracurricular data for students in this rombel
                const ekskulList = await prisma.data_eskul.findMany({
                    where: {
                        id_santri: { in: anggotaIds }
                    },
                    select: {
                        id: true,
                        id_santri: true,
                        id_mapel: true,
                        tgl_masuk: true,
                        tgl_keluar: true
                    }
                });

                // Fetch mapel data for all id_mapel in ekskulList
                const mapelIds = [...new Set(ekskulList.map(ekskul => ekskul.id_mapel))];
                const mapelList = await prisma.ref_mapel.findMany({
                    where: {
                        id: { in: mapelIds },
                        tipe: "extracurricular"
                    },
                    select: {
                        id: true,
                        nama: true
                    }
                });

                // Create a map of mapel ID to name
                const mapelMap = mapelList.reduce((acc, mapel) => {
                    acc[mapel.id] = mapel.nama;
                    return acc;
                }, {});

                // Group extracurriculars by student
                const ekskulMap = ekskulList.reduce((acc, ekskul) => {
                    if (!acc[ekskul.id_santri]) {
                        acc[ekskul.id_santri] = [];
                    }
                    const ekskulName = mapelMap[ekskul.id_mapel] || "Unknown";
                    acc[ekskul.id_santri].push({
                        id: ekskul.id,
                        nama: ekskulName
                    });
                    return acc;
                }, {});

                // Create student list with extracurricular data
                const simplifiedStudents = rombel.data_rombel_anggota
                    .filter(anggota => santriMap[anggota.id_santri]) // Ensure santri exists
                    .map(anggota => ({
                        id: santriMap[anggota.id_santri].id,
                        nis: santriMap[anggota.id_santri].nis,
                        nama: santriMap[anggota.id_santri].nama,
                        kelas: rombel.nama,
                        ekskul: ekskulMap[anggota.id_santri] || []
                    }));

                santriData.push({
                    class_id: rombel.id,
                    class: rombel.nama,
                    students: simplifiedStudents
                });
            }

            // Format final response
            if (groupbyclass === "true") {
                const sortedData = santriData.map(rombel => {
                    rombel.students.sort((a, b) => a.nama.localeCompare(b.nama));
                    return rombel;
                });
                return res.status(200).json(sortedData);
            } else {
                const flatList = santriData
                    .flatMap(item => item.students)
                    .sort((a, b) => a.nama.localeCompare(b.nama));
                return res.status(200).json(flatList);
            }
        } catch (error) {
            console.error(error);
            next(error);
        }
    };

    static getEkskulSantriById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { decoded, semester, tahunAjaran } = await getTokenPayload(req);

            // Get the student data
            const santri = await prisma.santri.findUnique({
                where: { id: parseInt(id) },
                select: { id: true, nis: true, nama: true }
            });

            if (!santri) {
                return res.status(404).json({ message: "Student not found" });
            }

            // Get the student's class membership
            const rombelAnggota = await prisma.data_rombel_anggota.findFirst({
                where: {
                    id_santri: parseInt(id),
                    data_rombel: {
                        id_tahun_ajaran: tahunAjaran.id
                    }
                },
                include: {
                    data_rombel: {
                        select: {
                            id: true,
                            nama: true
                        }
                    }
                }
            });

            if (!rombelAnggota) {
                return res.status(200).json({
                    id: santri.id,
                    nis: santri.nis,
                    nama: santri.nama,
                    kelas: null,
                    ekskul: []
                });
            }

            // Get the student's extracurricular activities
            const ekskulList = await prisma.data_eskul.findMany({
                where: {
                    id_santri: parseInt(id),
                    tgl_masuk: { lte: new Date() },
                    OR: [
                        { tgl_keluar: null },
                        { tgl_keluar: { gte: new Date() } }
                    ]
                },
                select: {
                    id: true,
                    id_mapel: true,
                    tgl_masuk: true,
                    tgl_keluar: true
                }
            });

            // Get extracurricular names
            const mapelIds = ekskulList.map(ekskul => ekskul.id_mapel);
            const mapelList = await prisma.ref_mapel.findMany({
                where: {
                    id: { in: mapelIds },
                    tipe: "extracurricular"
                },
                select: {
                    id: true,
                    nama: true
                }
            });

            // Map extracurricular IDs to names
            const mapelMap = mapelList.reduce((acc, mapel) => {
                acc[mapel.id] = mapel.nama;
                return acc;
            }, {});

            // Format extracurricular data
            const ekskulData = ekskulList.map(ekskul => ({
                id: ekskul.id,
                nama: mapelMap[ekskul.id_mapel] || "Unknown",
                tgl_masuk: ekskul.tgl_masuk,
                tgl_keluar: ekskul.tgl_keluar
            }));

            // Return the formatted response
            return res.status(200).json({
                id: santri.id,
                nis: santri.nis,
                nama: santri.nama,
                kelas: rombelAnggota.data_rombel.nama,
                ekskul: ekskulData
            });

        } catch (error) {
            console.error(error);
            next(error);
        }
    };

    static updateEkskulSantri = async (req, res) => {
        try {
            const { id } = req.params;
            const { kode, nama, kkm_1, kkm_2, kkm_3, keterangan, id_kurikulum } = req.body;

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
                    id_kurikulum: id_kurikulum ? parseInt(id_kurikulum) : mapel.id_kurikulum
                }
            });

            res.status(200).json(updatedMapel);
        } catch (error) {
            next(error);
        }
    };

    static deleteEkskulSantri = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { id_mapel } = req.body;

            const id_mapel_list = Array.isArray(id_mapel) ? id_mapel : [id_mapel];

            if (id_mapel_list.length === 0) {
                return res.status(400).json({
                    message: "id_mapel list cannot be empty"
                });
            }

            // Jalankan penghapusan dalam satu transaksi
            await prisma.$transaction(
                id_mapel_list.map((mapelId) =>
                    prisma.data_eskul.deleteMany({
                        where: {
                            id_santri: parseInt(id),
                            id_mapel: parseInt(mapelId)
                        }
                    })
                )
            );

            res.status(200).json({
                message: "Mapel berhasil dihapus"
            });
        } catch (error) {
            next(error);
        }
    };

}