import {JWTService} from "../services/jwt.service.js";

import { prisma } from "../prisma.js";
import {getTokenPayload} from "../helpers.js";

export class PrestasiPelanggaranController {
    static createPrestasiPelanggaran = async (req, res, next) => {
        try {
            const {
                id_santri,
                perihal,
                judul,
                capaian,
                tanggal,
                tempat,
                deskripsi,
                resolusi,
                tipe_pelanggaran
            } = JSON.parse(req.body.data);

            const file_bukti = req.files;

            let file_bukti_list = [];

            for (const file of file_bukti) {
                file_bukti_list.push(`/uploads/bukti-prpl/${perihal === 'prestasi' ? 'prestasi' : 'pelanggaran'}/${file.filename}`);
            }

            console.log(file_bukti_list);

            // Validasi input
            if (!id_santri || !perihal || !judul || !tempat || !deskripsi ) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Field wajib harus diisi'
                });
            }

            // Validasi enum perihal
            if (!['prestasi', 'pelanggaran'].includes(perihal)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Perihal harus prestasi atau pelanggaran'
                });
            }

            // Validasi enum tipe_pelanggaran jika perihal adalah pelanggaran
            if (perihal === 'pelanggaran' && tipe_pelanggaran && !['Sekolah', 'Asrama'].includes(tipe_pelanggaran)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Tipe pelanggaran harus Sekolah atau Asrama'
                });
            }

            // Buat data baru
            const newData = await prisma.data_prestasi_pelanggaran.create({
                data: {
                    id_santri,
                    perihal,
                    judul,
                    capaian: capaian || null,
                    tanggal: tanggal ? new Date(tanggal) : new Date(),
                    tempat,
                    deskripsi,
                    bukti: file_bukti_list.toString(),
                    resolusi: resolusi || null,
                    tipe_pelanggaran
                }
            });

            return res.status(201).json(newData);
        } catch (error) {
            next(error);
        }
    };

    static getAllPrestasiPelanggaran = async (req, res, next) => {
        try {
            const { groupbyclass, class: className, type, cat } = req.query;
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

                // Build prestasi/pelanggaran where clause
                const prestasiPelanggaranWhere = { id_santri: { in: anggotaIds } };

                // Filter by type (all, asrama, sekolah)
                if (type && type !== 'all') {
                    prestasiPelanggaranWhere.tipe_prestasi_pelanggaran = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
                }

                // Filter by category (pr for prestasi, pl for pelanggaran)
                if (cat === 'pr') {
                    prestasiPelanggaranWhere.perihal = 'prestasi';
                } else if (cat === 'pl') {
                    prestasiPelanggaranWhere.perihal = 'pelanggaran';
                }

                // Fetch prestasi/pelanggaran data
                const prestasiPelanggaranList = await prisma.data_prestasi_pelanggaran.findMany({
                    where: prestasiPelanggaranWhere,
                });

                // Group prestasi/pelanggaran by student
                const prestasiPelanggaranMap = prestasiPelanggaranList.reduce((acc, item) => {
                    if (!acc[item.id_santri]) {
                        acc[item.id_santri] = [];
                    }
                    acc[item.id_santri].push({
                        id: item.id,
                        perihal: item.perihal,
                        judul: item.judul,
                        capaian: item.capaian,
                        tanggal: item.tanggal,
                        tempat: item.tempat,
                        deskripsi: item.deskripsi,
                        tipe: item.tipe_pelanggaran,
                        bukti: item.bukti,
                        resolusi: item.resolusi
                    });
                    return acc;
                }, {});

                // Create student list with prestasi/pelanggaran data
                const simplifiedStudents = rombel.data_rombel_anggota
                    .filter(anggota => santriMap[anggota.id_santri])
                    .map(anggota => ({
                        id: santriMap[anggota.id_santri].id,
                        nis: santriMap[anggota.id_santri].nis,
                        nama: santriMap[anggota.id_santri].nama,
                        kelas: rombel.nama,
                        prestasi_pelanggaran: prestasiPelanggaranMap[anggota.id_santri] || []
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

    static getPrestasiPelanggaranById = async (req, res) => {
        try {
            const { id, idkur } = req.params;

            const mapel = await prisma.ref_mapel.findFirst({
                where: {
                    id: parseInt(id),
                    id_kurikulum: parseInt(idkur)
                }
            });

            if (!mapel) {
                return res.status(404).json({
                    success: false,
                    message: "Subject not found"
                });
            }

            res.json({
                success: true,
                data: mapel
            });
        } catch (error) {
            console.error("Error fetching mapel:", error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

    static updatePrestasiPelanggaran = async (req, res) => {
        try {
            const { id, idkur } = req.params;
            const { kode, nama, kkm_1, kkm_2, kkm_3, keterangan, sifat } = req.body;

            // Check if mapel exists
            const existingMapel = await prisma.ref_mapel.findFirst({
                where: {
                    id: parseInt(id),
                    id_kurikulum: parseInt(idkur)
                }
            });

            if (!existingMapel) {
                return res.status(404).json({
                    success: false,
                    message: "Subject not found"
                });
            }

            // If code is being updated, check if it already exists
            if (kode && kode !== existingMapel.kode) {
                const kodeExists = await prisma.ref_mapel.findFirst({
                    where: {
                        kode,
                        keterangan,
                        id_kurikulum: parseInt(idkur),
                        NOT: {
                            id: parseInt(id)
                        }
                    }
                });

                if (kodeExists) {
                    return res.status(400).json({
                        success: false,
                        message: "Subject code already exists in this curriculum"
                    });
                }
            }

            const updatedMapel = await prisma.ref_mapel.update({
                where: { id: parseInt(id) },
                data: {
                    kode,
                    nama,
                    kkm_1,
                    kkm_2,
                    kkm_3,
                    keterangan,
                    sifat
                }
            });

            res.json({
                success: true,
                data: updatedMapel
            });
        } catch (error) {
            console.error("Error updating mapel:", error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

    static deletePrestasiPelanggaran = async (req, res) => {
        try {
            const { id, idkur } = req.params;

            // Check if mapel exists
            const existingMapel = await prisma.ref_mapel.findFirst({
                where: {
                    id: parseInt(id),
                    id_kurikulum: parseInt(idkur)
                }
            });

            if (!existingMapel) {
                return res.status(404).json({
                    success: false,
                    message: "Subject not found"
                });
            }

            await prisma.ref_mapel.delete({
                where: { id: parseInt(id) }
            });

            res.json({
                success: true,
                message: "Subject deleted successfully"
            });
        } catch (error) {
            console.error("Error deleting mapel:", error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };
}