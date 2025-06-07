import { prisma } from "../prisma.js";
import {getTokenPayload} from "../helpers.js";
import path, {dirname, join} from "path";
import {fileURLToPath} from "url";
import {promises as fs} from "fs";

export class RaporController {
    static async getJenis(req, res, next) {
        try {
            const jenis = await prisma.ref_jenis_rapor.findMany({
                orderBy: {
                    nama: 'asc',
                },
            });

            res.status(200).json(jenis);
        } catch (error) {
            next(error);
        }
    }

    static async getLeger(req, res, next) {
        try {
            const { groupbyclass, class: className, gender } = req.query;
            const { decoded, semester, tahunAjaran } = await getTokenPayload(req);

            // Validasi gender
            const validGenders = ['L', 'P'];
            const genderFilter = gender && validGenders.includes(gender.toUpperCase()) ? { jk: gender.toUpperCase() } : {};

            let santriData = [];

            // Kumpulkan semua id_santri yang terdaftar di rombel
            const allAnggotas = await prisma.data_rombel_anggota.findMany({
                select: { id_santri: true },
            });
            const allAnggotaIds = new Set(allAnggotas.map((anggota) => anggota.id_santri));

            const jenis_rapor = await prisma.ref_jenis_rapor.findMany({
                orderBy: { nama: 'asc' },
            });

            let whereClause = { id_tahun_ajaran: tahunAjaran.id };
            if (className && className !== "") {
                const ref_kelas = await prisma.ref_kelas.findFirst({
                    where: { kelas: className },
                });
                if (!ref_kelas) {
                    return res.status(404).json({ message: `Kelas ${className} tidak ditemukan` });
                }
                whereClause["id_kelas"] = ref_kelas.id;
            }

            const rombelsData = await prisma.data_rombel.findMany({
                where: whereClause,
                include: {
                    data_rombel_anggota: true,
                    ref_kelas: true,
                },
                orderBy: [
                    { ref_kelas: { id_tingkat: 'asc' } },
                    { ref_kelas: { urutan: 'asc' } },
                ],
            });

            const rombels = rombelsData.map((rombel) => {
                const { ref_master_kategori_data_rombel, ref_kelas, ...rest } = rombel;
                return {
                    ...rest,
                    nama: ref_kelas?.kelas || "Unknown",
                };
            });

            for (const rombel of rombels) {
                const anggotaIds = rombel.data_rombel_anggota.map((anggota) => anggota.id_santri);

                const santriList = await prisma.santri.findMany({
                    where: {
                        AND: [
                            { id: { in: anggotaIds } },
                            genderFilter, // Tambahkan filter gender
                        ],
                    },
                    select: { id: true, nis: true, nama: true },
                });
                const statusList = await prisma.santri_status.findMany({
                    where: { id_santri: { in: anggotaIds } },
                    select: { id_santri: true, tahun_ajaran_masuk: true, pindahan: true },
                });
                const statusMap = statusList.reduce((acc, status) => {
                    acc[status.id_santri] = status;
                    return acc;
                }, {});
                const simplifiedStudents = santriList.map((santri) => {
                    const stat = statusMap[santri.id] || {};
                    return {
                        id: santri.id,
                        nis: santri.nis,
                        nama: santri.nama,
                        kelas: rombel.nama,
                        rapor: jenis_rapor.map((j) => {
                            return {
                                id_rapor: j.id,
                            };
                        })
                    };
                });
                santriData.push({
                    class_id: rombel.id,
                    class: rombel.nama,
                    rapor: jenis_rapor,
                    students: simplifiedStudents,
                });
            }

            if (groupbyclass === "true") {
                const sortedData = santriData.map((rombel) => {
                    rombel.students.sort((a, b) => a.nama.localeCompare(b.nama));
                    return rombel;
                });
                return res.status(200).json(sortedData);
            } else {
                const flatList = santriData
                    .flatMap((item) => item.students)
                    .sort((a, b) => a.nama.localeCompare(b.nama));
                return res.status(200).json(flatList);
            }
        } catch (e) {
            next(e);
        }
    }

    static async print(req, res, next) {
        try {
            const { id_jenis_rapor, id_santri } = req.params;

            const template_avail = {
                1: "rapor_pondok",
                2: "rapor_k13",
            };

            if (!template_avail[id_jenis_rapor]) {
                return res.status(400).json({ message: "Jenis rapor tidak valid" });
            }

            const templatePath = path.join(__dirname, '../views/templates', `${template_avail[id_jenis_rapor]}.ejs`);

            const filename = `rapor_${id_santri}_${template_avail[id_jenis_rapor]}.pdf`;

            await printPdf(res, data, templatePath, 'Portrait', filename);

        } catch (e) {
            next(e);
        }
    }

    static async setRaporDetail(req, res, next) {
        try {
            const { id_jenjang } = req.body.data ? JSON.parse(req.body.data) : req.body;

            // Validasi input minimal (hanya id_jenjang yang wajib)
            if (!id_jenjang) {
                return res.status(400).json({
                    status: 'error',
                    message: 'id_jenjang is required'
                });
            }

            // Validasi id_jenjang hanya untuk SMP (1) atau SMA (2)
            if (parseInt(id_jenjang) !== 1 && parseInt(id_jenjang) !== 2) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Only SMP (id_jenjang = 1) and SMA (id_jenjang = 2) are allowed'
                });
            }

            // Pastikan id_jenjang ada di tabel ref_jenjang
            const jenjangExists = await prisma.ref_jenjang.findUnique({
                where: { id: parseInt(id_jenjang) }
            });

            if (!jenjangExists) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Jenjang not found'
                });
            }

            // Ambil data existing
            const existingRapor = await prisma.ref_tanggal_rapor.findFirst({
                where: { id_jenjang: parseInt(id_jenjang) }
            });

            if (!existingRapor && (await prisma.ref_tanggal_rapor.count()) >= 2) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Maximum limit of 2 records (SMP and SMA) reached'
                });
            }

            const requestData = req.body.data ? JSON.parse(req.body.data) : req.body;
            const allowedFields = [
                'tanggal_mid',
                'tanggal_akhir',
                'tanggal_biodata',
                'tempat_biodata',
                'nama_kepsek',
                'niy_kepsek'
            ];

            const updateData = { id_jenjang: parseInt(id_jenjang) };
            for (const field of allowedFields) {
                if (requestData.hasOwnProperty(field)) {
                    updateData[field] = requestData[field];
                }
            }

            let foto_ttd = existingRapor?.foto_ttd || '';

            // Penanganan file yang diunggah
            if (req.file) {
                const __filename = fileURLToPath(import.meta.url);
                const __dirname = dirname(__filename);
                const uploadDir = join(__dirname, '../../uploads/ttd_kepsek');
                foto_ttd = `/uploads/ttd_kepsek/${req.file.filename}`;

                // Hapus foto lama jika ada
                if (existingRapor?.foto_ttd) {
                    const oldFilePath = join(uploadDir, path.basename(existingRapor.foto_ttd));
                    try {
                        await fs.access(oldFilePath);
                        await fs.unlink(oldFilePath);
                    } catch (err) {
                        console.error(`Failed to delete old photo: ${err.message}`);
                    }
                }
            }

            if (foto_ttd) {
                updateData.foto_ttd = foto_ttd;
            }

            const result = await prisma.$transaction(async (prisma) => {
                if (existingRapor) {
                    return await prisma.ref_tanggal_rapor.update({
                        where: { id: existingRapor.id },
                        data: updateData
                    });
                } else {
                    // Validasi field wajib untuk create
                    if (!updateData.tanggal_mid || !updateData.tanggal_akhir || !updateData.tanggal_biodata ||
                        !updateData.tempat_biodata || !updateData.nama_kepsek || !updateData.niy_kepsek) {
                        return res.status(400).json({
                            status: 'error',
                            message: 'All fields are required for creating a new record'
                        });
                    }

                    return await prisma.ref_tanggal_rapor.create({
                        data: {
                            ...updateData,
                            tanggal_mid: new Date(updateData.tanggal_mid),
                            tanggal_akhir: new Date(updateData.tanggal_akhir),
                            tanggal_biodata: new Date(updateData.tanggal_biodata)
                        }
                    });
                }
            });

            return res.status(200).json({
                status: 'success',
                message: existingRapor ? 'Data rapor berhasil diperbarui' : 'Data rapor berhasil ditambahkan',
                data: result
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    }

    // Mengambil detail rapor berdasarkan id_jenjang
    static async getRaporDetail(req, res, next) {
        try {
            const raporDetail = await prisma.ref_tanggal_rapor.findMany({
                include: {
                    ref_jenjang: true
                }
            });

            if (!raporDetail) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Rapor detail not found'
                });
            }

            return res.status(200).json(raporDetail);
        } catch (error) {
            next(error);
        }
    }

}