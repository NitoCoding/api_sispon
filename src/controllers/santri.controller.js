import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../prisma.js';
import mysql from 'mysql2/promise';
import {JWTService} from "../services/jwt.service.js";

export const createSantri = async (req, res, next) => {
    try {
        const {
            // Data santri
            nisn,
            nis,
            nama,
            foto,
            jk,
            tempat_ttl,
            tgl_ttl,
            agama,
            kesukuan,
            anak_ke,
            tinggi,
            berat,
            gol_darah,
            hobi,
            email,
            status,
            id_jenjang,
            warna_kulit,
            // Data kesehatan
            riwayat_penyakit,
            // Data kontak
            telepon,
            alamat,
            provinsi,
            kota,
            kode_pos,
            // Data pendidikan
            asal_sekolah,
            alamat_sekolah,
            nomor_ujian_sd,
            nomor_ujian_smp,
            no_skhun,
            tahun_skhun,
            // Data status
            tahun_ajaran_masuk,
            tahun_ajaran_tamat,
            tgl_masuk,
            tgl_keluar,
            pindahan,
            alasan_pindah,
            lanjut_ke,
            // Data keluarga
            nama_ayah,
            nama_ibu,
            nama_wali,
            pendidikan_ayah,
            pendidikan_ibu,
            pekerjaan_ayah,
            pekerjaan_ibu,
            pekerjaan_wali,
            suku_marga,
            alamat_keluarga,
            telepon_ayah,
            telepon_ibu,
            penghasilan_ayah,
            penghasilan_ibu,
            email_ayah,
        } = req.body;

        // Buat data santri
        const newSantri = await prisma.santri.create({
            data: {
                nisn,
                nis,
                nama,
                foto,
                jk,
                tempat_ttl,
                tgl_ttl: tgl_ttl ? new Date(tgl_ttl) : null,
                agama,
                kesukuan,
                anak_ke,
                tinggi,
                berat,
                gol_darah,
                hobi,
                email,
                status,
                id_jenjang,
                warna_kulit,
            },
        });

        // Buat data kesehatan
        await prisma.santri_kesehatan.create({
            data: {
                id_santri: newSantri.id,
                riwayat_penyakit,
            },
        });

        // Buat data kontak
        await prisma.santri_kontak.create({
            data: {
                id_santri: newSantri.id.toString(),
                telepon,
                alamat,
                provinsi,
                kota,
                kode_pos,
            },
        });

        // Buat data pendidikan
        await prisma.santri_pendidikan.create({
            data: {
                id_santri: newSantri.id,
                asal_sekolah,
                alamat_sekolah,
                nomor_ujian_sd,
                nomor_ujian_smp,
                no_skhun,
                tahun_skhun,
            },
        });

        // Buat data status
        await prisma.santri_status.create({
            data: {
                id_santri: newSantri.id,
                tahun_ajaran_masuk,
                tahun_ajaran_tamat,
                tgl_masuk: tgl_masuk ? new Date(tgl_masuk) : null,
                tgl_keluar: tgl_keluar ? new Date(tgl_keluar) : null,
                pindahan,
                alasan_pindah,
                lanjut_ke,
            },
        });

        // Buat data keluarga
        await prisma.santri_keluarga.create({
            data: {
                id_santri: newSantri.id,
                nama_ayah,
                nama_ibu,
                nama_wali,
                pendidikan_ayah,
                pendidikan_ibu,
                pekerjaan_ayah,
                pekerjaan_ibu,
                pekerjaan_wali,
                suku_marga,
                alamat: alamat_keluarga,
                telepon_ayah,
                telepon_ibu,
                penghasilan_ayah,
                penghasilan_ibu,
                email_ayah,
            },
        });

        res.status(201).json({ message: 'Santri created successfully', santri: newSantri });
    } catch (error) {
        next(error);
    }
};

export const getAllSantri = async (req, res, next) => {
    try {
        const { groupbyclass, class: className, simplify } = req.query;
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = JWTService.decodeToken(token);
        const academicYear = decoded.academic_year;
        if (!academicYear) {
            return res.status(400).json({ message: "Invalid token: Missing academic year" });
        }

        // Ambil tahun ajaran aktif
        const tahunAjaran = await prisma.ref_tahun_ajaran.findFirst({
            where: { id: academicYear },
        });
        if (!tahunAjaran) {
            return res.status(404).json({ message: "Academic year not found" });
        }

        const whereClause = { id_tahun_ajaran: tahunAjaran.id };
        if (className) {
            whereClause["nama"] = className;
        }

        // Ambil data rombel beserta anggota-anggotanya
        const rombels = await prisma.data_rombel.findMany({
            where: whereClause,
            include: {
                data_rombel_anggota: true,
            },
        });

        let santriData = [];

        for (const rombel of rombels) {
            // Dapatkan list id_santri dari tiap anggota rombel
            const anggotaIds = rombel.data_rombel_anggota.map(
                (anggota) => anggota.id_santri
            );

            if (simplify === "true") {
                // --- Branch: Simplify ---
                const santriList = await prisma.santri.findMany({
                    where: { id: { in: anggotaIds } },
                    select: {
                        id: true, // untuk penggabungan data status
                        nis: true,
                        nama: true,
                    },
                });

                const statusList = await prisma.santri_status.findMany({
                    where: { id_santri: { in: anggotaIds } },
                    select: {
                        id_santri: true,
                        tahun_ajaran_masuk: true,
                        pindahan: true,
                    },
                });

                const statusMap = statusList.reduce((acc, status) => {
                    acc[status.id_santri] = status;
                    return acc;
                }, {});

                const simplifiedStudents = santriList.map((santri) => {
                    const stat = statusMap[santri.id] || {};
                    return {
                        nis: santri.nis,
                        nama: santri.nama,
                        kelas: rombel.nama,
                        tahun_ajaran_masuk: stat.tahun_ajaran_masuk || null,
                        status: stat.pindahan ? "Pindahan" : "Baru",
                    };
                });

                santriData.push({
                    class: rombel.nama,
                    students: simplifiedStudents,
                });
            } else {
                // --- Branch: Non-Simplify (detail) ---
                const santriList = await prisma.santri.findMany({
                    where: { id: { in: anggotaIds } },
                });
                const santriWithDetails = await Promise.all(
                    santriList.map(async (santri) => {
                        const kesehatan = await prisma.santri_kesehatan.findFirst({
                            where: { id_santri: santri.id },
                        });
                        const kontak = await prisma.santri_kontak.findFirst({
                            where: { id_santri: santri.id.toString() },
                        });
                        const pendidikan = await prisma.santri_pendidikan.findFirst({
                            where: { id_santri: santri.id },
                        });
                        const status = await prisma.santri_status.findFirst({
                            where: { id_santri: santri.id },
                        });
                        const keluarga = await prisma.santri_keluarga.findFirst({
                            where: { id_santri: santri.id },
                        });
                        return {
                            ...santri,
                            riwayat_penyakit: kesehatan?.riwayat_penyakit || null,
                            telepon: kontak?.telepon || null,
                            alamat: kontak?.alamat || null,
                            provinsi: kontak?.provinsi || null,
                            kota: kontak?.kota || null,
                            kode_pos: kontak?.kode_pos || null,
                            asal_sekolah: pendidikan?.asal_sekolah || null,
                            alamat_sekolah: pendidikan?.alamat_sekolah || null,
                            nomor_ujian_sd: pendidikan?.nomor_ujian_sd || null,
                            nomor_ujian_smp: pendidikan?.nomor_ujian_smp || null,
                            no_skhun: pendidikan?.no_skhun || null,
                            tahun_skhun: pendidikan?.tahun_skhun || null,
                            tahun_ajaran_masuk: status?.tahun_ajaran_masuk || null,
                            tahun_ajaran_tamat: status?.tahun_ajaran_tamat || null,
                            tgl_masuk: status?.tgl_masuk || null,
                            tgl_keluar: status?.tgl_keluar || null,
                            pindahan: status?.pindahan || null,
                            alasan_pindah: status?.alasan_pindah || null,
                            lanjut_ke: status?.lanjut_ke || null,
                            nama_ayah: keluarga?.nama_ayah || null,
                            nama_ibu: keluarga?.nama_ibu || null,
                            nama_wali: keluarga?.nama_wali || null,
                            pendidikan_ayah: keluarga?.pendidikan_ayah || null,
                            pendidikan_ibu: keluarga?.pendidikan_ibu || null,
                            pekerjaan_ayah: keluarga?.pekerjaan_ayah || null,
                            pekerjaan_ibu: keluarga?.pekerjaan_ibu || null,
                            pekerjaan_wali: keluarga?.pekerjaan_wali || null,
                            suku_marga: keluarga?.suku_marga || null,
                            alamat_keluarga: keluarga?.alamat || null,
                            telepon_ayah: keluarga?.telepon_ayah || null,
                            telepon_ibu: keluarga?.telepon_ibu || null,
                            penghasilan_ayah: keluarga?.penghasilan_ayah || null,
                            penghasilan_ibu: keluarga?.penghasilan_ibu || null,
                            email_ayah: keluarga?.email_ayah || null,
                            // Tambahkan informasi kelas dari rombel
                            kelas: rombel.nama,
                        };
                    })
                );
                santriWithDetails.sort((a, b) => a.nama.localeCompare(b.nama));

                santriData.push({
                    class: rombel.nama,
                    students: santriWithDetails,
                });
            }
        }

        let allAnggotaIds = new Set()
        // Kumpulkan seluruh id santri yang terdaftar dalam rombel
        const allAnggotas = await prisma.data_rombel_anggota.findMany({
            select: {
                id_santri:true
            }
        });
        allAnggotas.forEach((element) => {
            allAnggotaIds.add(element.id_santri);
        })
        // rombels.forEach((rombel) => {
        //     rombel.data_rombel_anggota.forEach((anggota) => {
        //         allAnggotaIds.add(anggota.id_santri);
        //     });
        // });
        const anggotaIdsArray = Array.from(allAnggotaIds);
        console.log(anggotaIdsArray);

        // Ambil data santri yang tidak punya kelas (tidak ada di tabel anggota rombel)
        let noClassSantri = [];
        if (simplify === "true") {
            noClassSantri = await prisma.santri.findMany({
                where: anggotaIdsArray.length > 0
                    ? { id: { notIn: anggotaIdsArray } }
                    : {},
                select: { id: true, nis: true, nama: true }
            });
            const statusListNoClass = await prisma.santri_status.findMany({
                where: anggotaIdsArray.length > 0
                    ? { id_santri: { notIn: anggotaIdsArray } }
                    : {},
                select: { id_santri: true, tahun_ajaran_masuk: true, pindahan: true }
            });
            const statusNoClassMap = statusListNoClass.reduce((acc, stat) => {
                acc[stat.id_santri] = stat;
                return acc;
            }, {});
            noClassSantri = noClassSantri.map((santri) => {
                const stat = statusNoClassMap[santri.id] || {};
                return {
                    nis: santri.nis,
                    nama: santri.nama,
                    // Set property kelas sebagai "no_class"
                    kelas: "no_class",
                    tahun_ajaran_masuk: stat.tahun_ajaran_masuk || null,
                    status: stat.pindahan ? "Pindahan" : "Baru",
                };
            });
            noClassSantri.sort((a, b) => a.nama.localeCompare(b.nama));
        } else {
            noClassSantri = await prisma.santri.findMany({
                where: anggotaIdsArray.length > 0
                    ? { id: { notIn: anggotaIdsArray } }
                    : {}
            });
            noClassSantri = await Promise.all(
                noClassSantri.map(async (santri) => {
                    const kesehatan = await prisma.santri_kesehatan.findFirst({
                        where: { id_santri: santri.id },
                    });
                    const kontak = await prisma.santri_kontak.findFirst({
                        where: { id_santri: santri.id.toString() },
                    });
                    const pendidikan = await prisma.santri_pendidikan.findFirst({
                        where: { id_santri: santri.id },
                    });
                    const status = await prisma.santri_status.findFirst({
                        where: { id_santri: santri.id },
                    });
                    const keluarga = await prisma.santri_keluarga.findFirst({
                        where: { id_santri: santri.id },
                    });
                    return {
                        ...santri,
                        riwayat_penyakit: kesehatan?.riwayat_penyakit || null,
                        telepon: kontak?.telepon || null,
                        alamat: kontak?.alamat || null,
                        provinsi: kontak?.provinsi || null,
                        kota: kontak?.kota || null,
                        kode_pos: kontak?.kode_pos || null,
                        asal_sekolah: pendidikan?.asal_sekolah || null,
                        alamat_sekolah: pendidikan?.alamat_sekolah || null,
                        nomor_ujian_sd: pendidikan?.nomor_ujian_sd || null,
                        nomor_ujian_smp: pendidikan?.nomor_ujian_smp || null,
                        no_skhun: pendidikan?.no_skhun || null,
                        tahun_skhun: pendidikan?.tahun_skhun || null,
                        tahun_ajaran_masuk: status?.tahun_ajaran_masuk || null,
                        tahun_ajaran_tamat: status?.tahun_ajaran_tamat || null,
                        tgl_masuk: status?.tgl_masuk || null,
                        tgl_keluar: status?.tgl_keluar || null,
                        pindahan: status?.pindahan || null,
                        alasan_pindah: status?.alasan_pindah || null,
                        lanjut_ke: status?.lanjut_ke || null,
                        nama_ayah: keluarga?.nama_ayah || null,
                        nama_ibu: keluarga?.nama_ibu || null,
                        nama_wali: keluarga?.nama_wali || null,
                        pendidikan_ayah: keluarga?.pendidikan_ayah || null,
                        pendidikan_ibu: keluarga?.pendidikan_ibu || null,
                        pekerjaan_ayah: keluarga?.pekerjaan_ayah || null,
                        pekerjaan_ibu: keluarga?.pekerjaan_ibu || null,
                        pekerjaan_wali: keluarga?.pekerjaan_wali || null,
                        suku_marga: keluarga?.suku_marga || null,
                        alamat_keluarga: keluarga?.alamat || null,
                        telepon_ayah: keluarga?.telepon_ayah || null,
                        telepon_ibu: keluarga?.telepon_ibu || null,
                        penghasilan_ayah: keluarga?.penghasilan_ayah || null,
                        penghasilan_ibu: keluarga?.penghasilan_ibu || null,
                        email_ayah: keluarga?.email_ayah || null,
                        // Set property kelas
                        kelas: "no_class",
                    };
                })
            );
            noClassSantri.sort((a, b) => a.nama.localeCompare(b.nama));
        }

        // Masukkan data santri yang tidak punya kelas sebagai salah satu kelas
        santriData.push({
            class: "no_class",
            students: noClassSantri,
        });

        // Penyusunan response akhir (baik grouped maupun flatten)
        if (simplify === "true") {
            if (groupbyclass === "true") {
                // Urutkan setiap kelas berdasarkan nama siswa
                const sortedData = santriData.map((rombel) => {
                    rombel.students.sort((a, b) => a.nama.localeCompare(b.nama));
                    return rombel;
                });
                return res.status(200).json(sortedData);
            } else {
                // Mode flatten: gabungkan semua siswa (dari kelas dan no_class)
                const flatList = santriData
                    .flatMap((item) => item.students)
                    .sort((a, b) => a.nama.localeCompare(b.nama));
                return res.status(200).json(flatList);
            }
        } else {
            if (groupbyclass === "true") {
                return res.status(200).json(santriData);
            } else {
                const flatList = santriData
                    .flatMap((item) => item.students)
                    .sort((a, b) => a.nama.localeCompare(b.nama));
                return res.status(200).json(flatList);
            }
        }
    } catch (error) {
        next(error);
    }
};

export const getSantriById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Ambil data santri
        const santri = await prisma.santri.findUnique({
            where: { id: parseInt(id) },
        });

        if (!santri) {
            return res.status(404).json({ message: 'Santri not found' });
        }

        // Ambil data dari tabel terkait
        const kesehatan = await prisma.santri_kesehatan.findFirst({
            where: { id_santri: santri.id },
        });
        const kontak = await prisma.santri_kontak.findFirst({
            where: { id_santri: santri.id.toString() },
        });
        const pendidikan = await prisma.santri_pendidikan.findFirst({
            where: { id_santri: santri.id },
        });
        const status = await prisma.santri_status.findFirst({
            where: { id_santri: santri.id },
        });
        const keluarga = await prisma.santri_keluarga.findFirst({
            where: { id_santri: santri.id },
        });

        // Gabungkan semua data ke dalam satu objek
        const santriData = {
            // Data santri
            ...santri,
            // Data kesehatan
            riwayat_penyakit: kesehatan?.riwayat_penyakit || null,
            // Data kontak
            telepon: kontak?.telepon || null,
            alamat: kontak?.alamat || null,
            provinsi: kontak?.provinsi || null,
            kota: kontak?.kota || null,
            kode_pos: kontak?.kode_pos || null,
            // Data pendidikan
            asal_sekolah: pendidikan?.asal_sekolah || null,
            alamat_sekolah: pendidikan?.alamat_sekolah || null,
            nomor_ujian_sd: pendidikan?.nomor_ujian_sd || null,
            nomor_ujian_smp: pendidikan?.nomor_ujian_smp || null,
            no_skhun: pendidikan?.no_skhun || null,
            tahun_skhun: pendidikan?.tahun_skhun || null,
            // Data status
            tahun_ajaran_masuk: status?.tahun_ajaran_masuk || null,
            tahun_ajaran_tamat: status?.tahun_ajaran_tamat || null,
            tgl_masuk: status?.tgl_masuk || null,
            tgl_keluar: status?.tgl_keluar || null,
            pindahan: status?.pindahan || null,
            alasan_pindah: status?.alasan_pindah || null,
            lanjut_ke: status?.lanjut_ke || null,
            // Data keluarga
            nama_ayah: keluarga?.nama_ayah || null,
            nama_ibu: keluarga?.nama_ibu || null,
            nama_wali: keluarga?.nama_wali || null,
            pendidikan_ayah: keluarga?.pendidikan_ayah || null,
            pendidikan_ibu: keluarga?.pendidikan_ibu || null,
            pekerjaan_ayah: keluarga?.pekerjaan_ayah || null,
            pekerjaan_ibu: keluarga?.pekerjaan_ibu || null,
            pekerjaan_wali: keluarga?.pekerjaan_wali || null,
            suku_marga: keluarga?.suku_marga || null,
            alamat_keluarga: keluarga?.alamat || null,
            telepon_ayah: keluarga?.telepon_ayah || null,
            telepon_ibu: keluarga?.telepon_ibu || null,
            penghasilan_ayah: keluarga?.penghasilan_ayah || null,
            penghasilan_ibu: keluarga?.penghasilan_ibu || null,
            email_ayah: keluarga?.email_ayah || null,
        };

        res.status(200).json(santriData);
    } catch (error) {
        next(error);
    }
};

export const updateSantri = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            // Data santri
            nis_nasional,
            nis,
            nama,
            foto,
            jk,
            tempat_ttl,
            tgl_ttl,
            agama,
            kesukuan,
            anak_ke,
            tinggi,
            berat,
            gol_darah,
            hobi,
            email,
            status,
            id_jenjang,
            warna_kulit,
            // Data kesehatan
            riwayat_penyakit,
            // Data kontak
            telepon,
            alamat,
            provinsi,
            kota,
            kode_pos,
            // Data pendidikan
            asal_sekolah,
            alamat_sekolah,
            nomor_ujian_sd,
            nomor_ujian_smp,
            no_skhun,
            tahun_skhun,
            // Data status
            tahun_ajaran_masuk,
            tahun_ajaran_tamat,
            tgl_masuk,
            tgl_keluar,
            pindahan,
            alasan_pindah,
            lanjut_ke,
            // Data keluarga
            nama_ayah,
            nama_ibu,
            nama_wali,
            pendidikan_ayah,
            pendidikan_ibu,
            pekerjaan_ayah,
            pekerjaan_ibu,
            pekerjaan_wali,
            suku_marga,
            alamat_keluarga,
            telepon_ayah,
            telepon_ibu,
            penghasilan_ayah,
            penghasilan_ibu,
            email_ayah,
        } = req.body;

        // Update data santri
        const updatedSantri = await prisma.santri.update({
            where: { id: parseInt(id) },
            data: {
                nis_nasional,
                nis,
                nama,
                foto,
                jk,
                tempat_ttl,
                tgl_ttl: tgl_ttl ? new Date(tgl_ttl) : null,
                agama,
                kesukuan,
                anak_ke,
                tinggi,
                berat,
                gol_darah,
                hobi,
                email,
                status,
                id_jenjang,
                warna_kulit,
            },
        });

        // Update data kesehatan
        await prisma.santri_kesehatan.updateMany({
            where: { id_santri: parseInt(id) },
            data: { riwayat_penyakit },
        });

        // Update data kontak
        await prisma.santri_kontak.updateMany({
            where: { id_santri: id.toString() },
            data: { telepon, alamat, provinsi, kota, kode_pos },
        });

        // Update data pendidikan
        await prisma.santri_pendidikan.updateMany({
            where: { id_santri: parseInt(id) },
            data: { asal_sekolah, alamat_sekolah, nomor_ujian_sd, nomor_ujian_smp, no_skhun, tahun_skhun },
        });

        // Update data status
        await prisma.santri_status.updateMany({
            where: { id_santri: parseInt(id) },
            data: {
                tahun_ajaran_masuk,
                tahun_ajaran_tamat,
                tgl_masuk: tgl_masuk ? new Date(tgl_masuk) : null,
                tgl_keluar: tgl_keluar ? new Date(tgl_keluar) : null,
                pindahan,
                alasan_pindah,
                lanjut_ke,
            },
        });

        // Update data keluarga
        await prisma.santri_keluarga.updateMany({
            where: { id_santri: parseInt(id) },
            data: {
                nama_ayah,
                nama_ibu,
                nama_wali,
                pendidikan_ayah,
                pendidikan_ibu,
                pekerjaan_ayah,
                pekerjaan_ibu,
                pekerjaan_wali,
                suku_marga,
                alamat: alamat_keluarga,
                telepon_ayah,
                telepon_ibu,
                penghasilan_ayah,
                penghasilan_ibu,
                email_ayah,
            },
        });

        res.status(200).json({ message: 'Santri updated successfully', santri: updatedSantri });
    } catch (error) {
        next(error);
    }
};

export const deleteSantri = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Hapus data dari semua tabel terkait
        await prisma.santri_kesehatan.deleteMany({
            where: { id_santri: parseInt(id) },
        });
        await prisma.santri_kontak.deleteMany({
            where: { id_santri: id.toString() },
        });
        await prisma.santri_pendidikan.deleteMany({
            where: { id_santri: parseInt(id) },
        });
        await prisma.santri_status.deleteMany({
            where: { id_santri: parseInt(id) },
        });
        await prisma.santri_keluarga.deleteMany({
            where: { id_santri: parseInt(id) },
        });

        // Hapus data santri
        await prisma.santri.delete({
            where: { id: parseInt(id) },
        });

        res.status(200).json({ message: 'Santri deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const migrateSantri = async (req, res, next) => {
    try {
        // Konfigurasi koneksi ke database lama
        const connection = await mysql.createConnection({
            host: process.env.OLD_DB_HOST, // Host database lama
            user: process.env.OLD_DB_USER, // User database lama
            password: process.env.OLD_DB_PASSWORD, // Password database lama
            database: process.env.OLD_DB_NAME, // Nama database lama
        });

        // Ambil semua data dari tabel lama
        const [rows] = await connection.execute('SELECT * FROM tb_santri'); // Ganti dengan nama tabel lama

        // Tutup koneksi ke database lama
        await connection.end();

        // Mapping nama bulan ke angka
        const bulanToNumber = {
            Januari: '01',
            Februari: '02',
            Maret: '03',
            April: '04',
            Mei: '05',
            Juni: '06',
            Juli: '07',
            Agustus: '08',
            September: '09',
            Oktober: '10',
            November: '11',
            Desember: '12',
        };

        // Mapping status
        const statusMapping = {
            l: 'Alumni',
            d: 'Tidak_Aktif',
            a: 'Aktif',
            p: 'Pindah',
        };

        // let count = 0;

        // Loop melalui setiap baris data dan masukkan ke tabel baru
        for (const row of rows) {
            // count++;
            // console.log(count);
            // if (count < 1450) {
            //     continue;
            // }
            const {
                id_santri,
                nisn,
                nis,
                nama,
                foto_st,
                jkl,
                tempat_lahir,
                tgl_lahir,
                bln_lahir,
                tahun_lahir,
                agama,
                kesukuan,
                anak_ke,
                berat,
                tinggi,
                g_darah,
                warna_kulit,
                hoby,
                email,
                status,
                kelas_st,
                thn_ajaranmsk,
            } = row;

            // Cek apakah data dengan NIS yang sama sudah ada di database baru
            let existingSantri = await prisma.santri.findFirst({
                where: {
                    id: id_santri,
                    nis
                },
            });

            // Jika santri belum ada, buat data santri baru
            if (!existingSantri) {
                // Proses penggabungan tanggal lahir
                const tglLahir = tgl_lahir !== '-' && bln_lahir !== '-' && tahun_lahir !== '-'
                    ? `${tahun_lahir}-${bulanToNumber[bln_lahir]}-${tgl_lahir.padStart(2, '0')}` // Format: YYYY-MM-DD
                    : null; // Jika tidak valid, set null

                // Normalisasi jenis kelamin (jkl) ke huruf kapital
                let jenisKelamin = jkl ? jkl.toUpperCase() : null; // Konversi ke huruf kapital
                console.log({nis, nama, jenisKelamin, agama});
                // Validasi jenis kelamin
                if (jenisKelamin !== 'L' && jenisKelamin !== 'P') {
                    console.log(`Jenis kelamin tidak valid untuk NIS ${nis}: ${jenisKelamin}. Skip proses insert.`);
                    jenisKelamin = null;
                }

                // Mapping status
                const statusSantri = statusMapping[status.toLowerCase()] || null; // Default jika status tidak valid

                // Buat data santri baru di tabel baru
                existingSantri = await prisma.santri.create({
                    data: {
                        id: id_santri, // Jika id_santri ingin dipertahankan
                        nisn,
                        nis,
                        nama,
                        foto: foto_st,
                        jk: jenisKelamin, // Gunakan nilai yang sudah dinormalisasi
                        tempat_ttl: tempat_lahir,
                        tgl_ttl: tglLahir ? new Date(tglLahir) : null,
                        agama,
                        kesukuan,
                        anak_ke: parseInt(anak_ke) || null,
                        tinggi: parseFloat(tinggi) || null,
                        berat: parseFloat(berat) || null,
                        gol_darah: g_darah,
                        hobi: hoby,
                        email,
                        status: statusSantri, // Gunakan status yang sudah dipetakan
                        warna_kulit,
                    },
                });

                console.log(`Data dengan NIS ${nis} berhasil ditambahkan.`);
            } else {
                console.log(`Data dengan NIS ${nis} sudah ada. Melanjutkan pengecekan rombel.`);
            }

            // Proses untuk menambahkan data ke tabel rombel dan data_anggota_rombel
            const tahunAjaran = thn_ajaranmsk.split('/');
            const tahunMulai = parseInt(tahunAjaran[0]);
            const tahunSelesai = parseInt(tahunAjaran[1]);
            console.log(nis);
            // Cek apakah tahun ajaran sudah ada di tabel ref_tahun_ajaran
            let tahunAjaranRecord = await prisma.ref_tahun_ajaran.findFirst({
                where: {
                    tahun_mulai: tahunMulai,
                    tahun_selesai: tahunSelesai,
                },
            });

            // Jika tahun ajaran belum ada, tambahkan
            if (!tahunAjaranRecord) {
                tahunAjaranRecord = await prisma.ref_tahun_ajaran.create({
                    data: {
                        nama: `${tahunMulai}/${tahunSelesai}`,
                        tahun_mulai: tahunMulai,
                        tahun_selesai: tahunSelesai,
                        status: 'aktif',
                    },
                });
            }

            // Cek apakah rombel sudah ada di tabel data_rombel
            let rombelRecord = await prisma.data_rombel.findFirst({
                where: {
                    nama: kelas_st,
                    id_tahun_ajaran: tahunAjaranRecord.id,
                },
            });

            // Jika rombel belum ada, tambahkan
            if (!rombelRecord) {
                rombelRecord = await prisma.data_rombel.create({
                    data: {
                        nama: kelas_st,
                        id_tahun_ajaran: tahunAjaranRecord.id,
                        status: 'aktif',
                    },
                });
            }

            // Cek apakah santri sudah memiliki rombel di tahun ajaran ini
            const existingAnggotaRombel = await prisma.data_rombel_anggota.findFirst({
                where: {
                    id_santri: existingSantri.id,
                    id_rombel: rombelRecord.id,
                },
            });

            // Jika santri belum memiliki rombel, tambahkan ke data_anggota_rombel
            if (!existingAnggotaRombel) {
                await prisma.data_rombel_anggota.create({
                    data: {
                        id_rombel: rombelRecord.id,
                        id_santri: existingSantri.id,
                        status: 'aktif',
                    },
                });

                console.log(`Data santri dengan NIS ${nis} berhasil ditambahkan ke rombel ${kelas_st}.`);
            } else {
                console.log(`Data santri dengan NIS ${nis} sudah memiliki rombel ${kelas_st}.`);
            }
        }

        res.status(200).json({ message: 'Data migrated successfully' });
    } catch (error) {
        console.log(error);
        next(error);
    }
};