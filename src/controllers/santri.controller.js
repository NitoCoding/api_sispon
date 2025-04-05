import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../prisma.js';
import mysql from 'mysql2/promise';
import {JWTService} from "../services/jwt.service.js";
import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import exceljs from 'exceljs';

export const createSantri = async (req, res, next) => {
    try {
        if (!req.body.data) {
            return res.status(400).json({ message: 'Data tidak ditemukan' });
        }
        const {
            nisn,
            nis,
            nama,
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
            riwayat_penyakit,
            telepon,
            alamat,
            provinsi,
            kota,
            kode_pos,
            asal_sekolah,
            alamat_sekolah,
            nomor_ujian_sd,
            nomor_ujian_smp,
            no_skhun,
            tahun_skhun,
            tahun_ajaran_masuk,
            tahun_ajaran_tamat,
            tgl_masuk,
            tgl_keluar,
            pindahan,
            alasan_pindah,
            lanjut_ke,
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
        } = JSON.parse(req.body.data);

        // File foto diambil dari multer
        const foto = req.file ? `/uploads/${req.baseUrl === '/santris' ? 'foto_santri' : 'foto_guru_pegawai'}/${req.file.filename}` : null;

        // Transaksi Prisma
        const result = await prisma.$transaction(async (prisma) => {
            // Buat data Santri
            const newSantri = await prisma.santri.create({
                data: {
                    nisn,
                    nis,
                    nama,
                    foto, // Menyimpan path foto
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

            // Buat data tambahan
            await prisma.santri_kesehatan.create({
                data: {
                    id_santri: newSantri.id,
                    riwayat_penyakit,
                },
            });

            await prisma.santri_kontak.create({
                data: {
                    id_santri: newSantri.id,
                    telepon,
                    alamat,
                    provinsi,
                    kota,
                    kode_pos,
                },
            });

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

            return newSantri; // Kembalikan hasil operasi
        });

        res.status(201).json(result);
    } catch (error) {
        next(error); // Forward error ke middleware error handling
    }
};

export const createSantriMassal = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'File Excel tidak diunggah' });
        }

        const filePath = req.file.path;
        const workbook = new exceljs.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);

        const santriData = [];

        const headerMapping = {
            'Nomor Induk Siswa Nasional': 'nisn',
            'Nomor Induk Siswa': 'nis',
            'Nama Lengkap': 'nama',
            'Jenis Kelamin (l/p)': 'jk',
            'Tempat Lahir': 'tempat_ttl',
            'Tanggal Lahir': 'tgl_ttl',
            'Agama': 'agama',
            'Suku atau Etnis': 'kesukuan',
            'Anak Ke': 'anak_ke',
            'Tinggi Badan (cm)': 'tinggi',
            'Berat Badan (kg)': 'berat',
            'Golongan Darah': 'gol_darah',
            'Hobi': 'hobi',
            'Email': 'email',
            'Status Siswa': 'status',
            'Warna Kulit': 'warna_kulit',
            'Riwayat Penyakit': 'riwayat_penyakit',
            'Nomor Telepon': 'telepon',
            'Alamat': 'alamat',
            'Provinsi': 'provinsi',
            'Kota atau Kabupaten': 'kota',
            'Kode Pos': 'kode_pos',
            'Sekolah Asal': 'asal_sekolah',
            'Alamat Sekolah Asal': 'alamat_sekolah',
            'Nomor Ujian SD': 'nomor_ujian_sd',
            'Nomor Ujian SMP': 'nomor_ujian_smp',
            'Nomor SKHUN': 'no_skhun',
            'Tahun SKHUN': 'tahun_skhun',
            'Tahun Ajaran Masuk': 'tahun_ajaran_masuk',
            'Tahun Ajaran Tamat': 'tahun_ajaran_tamat',
            'Tanggal Masuk': 'tgl_masuk',
            'Tanggal Keluar': 'tgl_keluar',
            'Pindahan (0/1)': 'pindahan',
            'Alasan Pindah': 'alasan_pindah',
            'Lanjut Ke': 'lanjut_ke',
            'Nama Ayah': 'nama_ayah',
            'Nama Ibu': 'nama_ibu',
            'Nama Wali': 'nama_wali',
            'Pendidikan Ayah': 'pendidikan_ayah',
            'Pendidikan Ibu': 'pendidikan_ibu',
            'Pekerjaan Ayah': 'pekerjaan_ayah',
            'Pekerjaan Ibu': 'pekerjaan_ibu',
            'Pekerjaan Wali': 'pekerjaan_wali',
            'Suku atau Marga': 'suku_marga',
            'Alamat Keluarga': 'alamat_keluarga',
            'Nomor Telepon Ayah': 'telepon_ayah',
            'Nomor Telepon Ibu': 'telepon_ibu',
            'Penghasilan Ayah': 'penghasilan_ayah',
            'Penghasilan Ibu': 'penghasilan_ibu',
            'Email Ayah': 'email_ayah'
        };

        // Ambil header dari baris ke-12
        const headers = {};
        worksheet.getRow(12).eachCell((cell, colNumber) => {
            headers[colNumber] = cell.text;
        });

        // Proses data mulai dari baris ke-13
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber >= 13) { // Mulai dari baris 13
                const data = {};
                row.eachCell((cell, colNumber) => {
                    const field = headerMapping[headers[colNumber]];
                    if (field) {
                        data[field] = cell.text || null;
                    }
                });
                santriData.push(data);
            }
        });

        const results = await prisma.$transaction(async (prisma) => {
            const createdSantris = [];

            for (const santri of santriData) {
                const newSantri = await prisma.santri.create({
                    data: {
                        nisn: santri.nisn?.toString(),
                        nis: santri.nis?.toString(),
                        nama: santri.nama || null,
                        foto: null,
                        jk: santri.jk || null,
                        tempat_ttl: santri.tempat_ttl || null,
                        tgl_ttl: santri.tgl_ttl ? new Date(santri.tgl_ttl) : null,
                        agama: santri.agama || null,
                        kesukuan: santri.kesukuan || null,
                        anak_ke: santri.anak_ke ? parseInt(santri.anak_ke) : null,
                        tinggi: santri.tinggi ? parseFloat(santri.tinggi) : null,
                        berat: santri.berat ? parseFloat(santri.berat) : null,
                        gol_darah: santri.gol_darah || null,
                        hobi: santri.hobi || null,
                        email: santri.email || null,
                        status: santri.status || null,
                        id_jenjang: null,
                        warna_kulit: santri.warna_kulit || null,
                    },
                });

                await prisma.santri_kesehatan.create({
                    data: {
                        id_santri: newSantri.id,
                        riwayat_penyakit: santri.riwayat_penyakit || null,
                    },
                });

                await prisma.santri_kontak.create({
                    data: {
                        id_santri: newSantri.id,
                        telepon: santri.telepon?.toString() || null,
                        alamat: santri.alamat || null,
                        provinsi: santri.provinsi || null,
                        kota: santri.kota || null,
                        kode_pos: santri.kode_pos?.toString() || null,
                    },
                });

                await prisma.santri_pendidikan.create({
                    data: {
                        id_santri: newSantri.id,
                        asal_sekolah: santri.asal_sekolah || null,
                        alamat_sekolah: santri.alamat_sekolah || null,
                        nomor_ujian_sd: santri.nomor_ujian_sd?.toString() || null,
                        nomor_ujian_smp: santri.nomor_ujian_smp?.toString() || null,
                        no_skhun: santri.no_skhun?.toString() || null,
                        tahun_skhun: santri.tahun_skhun ? parseInt(santri.tahun_skhun) : null,
                    },
                });

                await prisma.santri_status.create({
                    data: {
                        id_santri: newSantri.id,
                        tahun_ajaran_masuk: santri.tahun_ajaran_masuk || null,
                        tahun_ajaran_tamat: santri.tahun_ajaran_tamat || null,
                        tgl_masuk: santri.tgl_masuk ? new Date(santri.tgl_masuk) : null,
                        tgl_keluar: santri.tgl_keluar ? new Date(santri.tgl_keluar) : null,
                        pindahan: santri.pindahan ? Boolean(parseInt(santri.pindahan)) : null,
                        alasan_pindah: santri.alasan_pindah || null,
                        lanjut_ke: santri.lanjut_ke || null,
                    },
                });

                await prisma.santri_keluarga.create({
                    data: {
                        id_santri: newSantri.id,
                        nama_ayah: santri.nama_ayah || null,
                        nama_ibu: santri.nama_ibu || null,
                        nama_wali: santri.nama_wali || null,
                        pendidikan_ayah: santri.pendidikan_ayah || null,
                        pendidikan_ibu: santri.pendidikan_ibu || null,
                        pekerjaan_ayah: santri.pekerjaan_ayah || null,
                        pekerjaan_ibu: santri.pekerjaan_ibu || null,
                        pekerjaan_wali: santri.pekerjaan_wali || null,
                        suku_marga: santri.suku_marga || null,
                        alamat: santri.alamat_keluarga || null,
                        telepon_ayah: santri.telepon_ayah?.toString() || null,
                        telepon_ibu: santri.telepon_ibu?.toString() || null,
                        penghasilan_ayah: santri.penghasilan_ayah?.toString() || null,
                        penghasilan_ibu: santri.penghasilan_ibu?.toString() || null,
                        email_ayah: santri.email_ayah || null,
                    },
                });

                createdSantris.push(newSantri);
            }

            return createdSantris;
        });

        // await fs.unlink(filePath);

        res.status(201).json(santriData);

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
        const semester = await prisma.ref_semester.findFirst({
            where: { id: parseInt(decoded.semester) },
        });
        if (!semester) {
            return res.status(400).json({ message: "Invalid token: Missing semester" });
        }

        // Ambil tahun ajaran aktif
        const tahunAjaran = await prisma.ref_tahun_ajaran.findFirst({
            where: { id: semester.id_tahun_ajaran },
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
                    class_id: rombel.id,
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
                            where: { id_santri: santri.id },
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
                    id_rombel: rombel.id,
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
                        where: { id_santri: santri.id },
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
            id_rombel: null,
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

export const getAlumni = async (req, res, next) => {
    try {
        const { id_tahun_ajaran } = req.params;
        const { simplify } = req.query; // Hanya gunakan simplify

        // Ambil tahun ajaran berdasarkan ID
        const tahunAjaran = await prisma.ref_tahun_ajaran.findFirst({
            where: { id: parseInt(id_tahun_ajaran) },
        });
        if (!tahunAjaran) {
            return res.status(404).json({ message: "Academic year not found" });
        }

        // Ambil semua santri_status dengan tahun_ajaran_tamat yang sesuai
        const alumniStatus = await prisma.santri_status.findMany({
            where: {
                tahun_ajaran_tamat: tahunAjaran.nama,
            },
            select: {
                id_santri: true,
            },
        });
        const alumniIds = alumniStatus.map(status => status.id_santri);

        // Jika tidak ada alumni untuk tahun ajaran ini
        if (alumniIds.length === 0) {
            return res.status(200).json([]);
        }

        // Kondisi untuk santri: hanya ambil yang statusnya 'Alumni'
        const whereClauseSantri = {
            status: 'Alumni',
            id: { in: alumniIds },
        };

        // Ambil data kelas terakhir dari data_rombel_anggota dan data_rombel
        const rombelAnggota = await prisma.data_rombel_anggota.findMany({
            where: {
                id_santri: { in: alumniIds },
            },
            include: {
                data_rombel: {
                    select: {
                        nama: true,
                        id_tahun_ajaran: true,
                    },
                },
            },
        });

        // Buat peta kelas terakhir berdasarkan tahun ajaran terbaru
        const latestClassMap = rombelAnggota.reduce((acc, anggota) => {
            const rombel = anggota.data_rombel;
            const currentTahunAjaranId = acc[anggota.id_santri]?.tahunAjaranId || 0;
            if (rombel.id_tahun_ajaran > currentTahunAjaranId) {
                acc[anggota.id_santri] = {
                    kelas: rombel.nama,
                    tahunAjaranId: rombel.id_tahun_ajaran,
                };
            }
            return acc;
        }, {});

        let alumniData = [];

        if (simplify === "true") {
            // --- Branch: Simplify ---
            const santriList = await prisma.santri.findMany({
                where: whereClauseSantri,
                select: {
                    id: true,
                    nis: true,
                    nama: true,
                },
            });

            const statusList = await prisma.santri_status.findMany({
                where: {
                    id_santri: { in: alumniIds },
                    tahun_ajaran_tamat: tahunAjaran.nama,
                },
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

            alumniData = santriList.map((santri) => {
                const stat = statusMap[santri.id] || {};
                const kelasTerakhir = latestClassMap[santri.id]?.kelas || "Tidak diketahui";
                return {
                    nis: santri.nis,
                    nama: santri.nama,
                    kelas: kelasTerakhir, // Tambahkan kelas terakhir
                    tahun_ajaran_masuk: stat.tahun_ajaran_masuk || null,
                    status: stat.pindahan ? "Pindahan" : "Baru",
                    tahun_ajaran_tamat: tahunAjaran.nama,
                };
            });
        } else {
            // --- Branch: Non-Simplify (detail) ---
            const santriList = await prisma.santri.findMany({
                where: whereClauseSantri,
            });

            alumniData = await Promise.all(
                santriList.map(async (santri) => {
                    const kesehatan = await prisma.santri_kesehatan.findFirst({
                        where: { id_santri: santri.id },
                    });
                    const kontak = await prisma.santri_kontak.findFirst({
                        where: { id_santri: santri.id },
                    });
                    const pendidikan = await prisma.santri_pendidikan.findFirst({
                        where: { id_santri: santri.id },
                    });
                    const status = await prisma.santri_status.findFirst({
                        where: {
                            id_santri: santri.id,
                            tahun_ajaran_tamat: tahunAjaran.nama,
                        },
                    });
                    const keluarga = await prisma.santri_keluarga.findFirst({
                        where: { id_santri: santri.id },
                    });
                    const kelasTerakhir = latestClassMap[santri.id]?.kelas || "Tidak diketahui";
                    return {
                        ...santri,
                        kelas: kelasTerakhir, // Tambahkan kelas terakhir
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
                    };
                })
            );
        }

        // Urutkan berdasarkan nama
        alumniData.sort((a, b) => a.nama.localeCompare(b.nama));

        // Kembalikan hasil dalam format flat array
        return res.status(200).json(alumniData);
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

        // Dapatkan foto lama dari database
        const fotoDb = await prisma.santri.findFirst({
            where: { id: parseInt(id) },
            select: { foto: true },
        });

        // Parsing data form dari req.body.data (format JSON dalam form-data)
        const {
            nisn,
            nis,
            nama,
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
            riwayat_penyakit,
            telepon,
            alamat,
            provinsi,
            kota,
            kode_pos,
            asal_sekolah,
            alamat_sekolah,
            nomor_ujian_sd,
            nomor_ujian_smp,
            no_skhun,
            tahun_skhun,
            tahun_ajaran_masuk,
            tahun_ajaran_tamat,
            tgl_masuk,
            tgl_keluar,
            pindahan,
            alasan_pindah,
            lanjut_ke,
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
        } = JSON.parse(req.body.data);

        // File foto baru dari multer
        const foto = req.file
            ? `/uploads/${req.baseUrl.split("/")[1]}/${req.file.filename}`
            : null;

        // Hapus foto lama jika ada foto baru
        if (fotoDb.foto && foto) {
            try {
                // Define __dirname for ES modules
                const __filename = fileURLToPath(import.meta.url);
                const __dirname = dirname(__filename);
                const filePath = join(__dirname, '../../..', fotoDb.foto.replace('/uploads/', 'uploads/'));
                await fs.unlink(filePath);
            } catch (err) {
                console.error(`Failed to delete old photo: ${err.message}`);
            }
        }

        // Gunakan transaksi untuk memastikan semua update berhasil
        const result = await prisma.$transaction(async (prisma) => {
            const updatedSantri = await prisma.santri.update({
                where: { id: parseInt(id) },
                data: {
                    nisn,
                    nis,
                    nama,
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
                    ...(foto && { foto }),
                },
            });

            await prisma.santri_kesehatan.updateMany({
                where: { id_santri: parseInt(id) },
                data: { riwayat_penyakit },
            });

            await prisma.santri_kontak.updateMany({
                where: { id_santri: parseInt(id) },
                data: { telepon, alamat, provinsi, kota, kode_pos },
            });

            await prisma.santri_pendidikan.updateMany({
                where: { id_santri: parseInt(id) },
                data: {
                    asal_sekolah,
                    alamat_sekolah,
                    nomor_ujian_sd,
                    nomor_ujian_smp,
                    no_skhun,
                    tahun_skhun,
                },
            });

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

            return updatedSantri;
        });

        res.status(200).json({ message: 'Santri updated successfully', santri: result });
    } catch (error) {
        next(error); // Forward error ke middleware error handling
    }
};


export const deleteSantri = async (req, res, next) => {
    try {
        const { id } = req.params;

        const fotoDb = await prisma.santri.findFirst({
            where: { id: parseInt(id) },
            select: { foto: true },
        })

        const result = await prisma.$transaction(async (prisma) => {
            // Hapus data dari semua tabel terkait
            await prisma.santri_kesehatan.deleteMany({
                where: { id_santri: parseInt(id) },
            });
            await prisma.santri_kontak.deleteMany({
                where: { id_santri: parseInt(id) },
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
            await prisma.santri.delete({
                where: { id: parseInt(id) },
            });
        })

        if (fotoDb.foto) {
            try {
                // Define __dirname for ES modules
                const __filename = fileURLToPath(import.meta.url);
                const __dirname = dirname(__filename);
                const filePath = join(__dirname, '../../..', fotoDb.foto.replace('/uploads/', 'uploads/'));
                await fs.unlink(filePath);
            } catch (err) {
                console.error(`Failed to delete old photo: ${err.message}`);
            }
        }

        res.status(200).json({
            message: 'Santri deleted successfully',
            santri: result,
        });
    } catch (error) {
        next(error);
    }
};

export const migrateSantri = async (req, res, next) => {
    try {
        // Konfigurasi koneksi ke database lama
        const connection = await mysql.createConnection({
            host: process.env.OLD_DB_HOST,
            user: process.env.OLD_DB_USER,
            password: process.env.OLD_DB_PASSWORD,
            database: process.env.OLD_DB_NAME,
        });

        // Ambil semua data dari tabel lama
        const [rows] = await connection.execute('SELECT * FROM tb_santri');

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

        // Transaksi untuk memastikan semua data dimasukkan secara atomik
        // await prisma.$transaction(async (prisma) => {
        //
        // }, { timeout: 360000000 });
        for (const row of rows) {
            const {
                id_santri,
                nis_nasional,
                nis,
                nama,
                kelas_st,
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
                penyakit,
                telpon,
                alamat,
                kota,
                propinsi,
                pos,
                email,
                asal_sekolah,
                asl_skl,
                n_ujian_sd,
                n_ujian_smp,
                no_skhun,
                tahun_shkun,
                tgl_masuk,
                bln_masuk,
                thn_masuk,
                tgl_keluar,
                bln_keluar,
                thn_keluar,
                pindahan,
                alasan_pindah,
                thn_ajaranmsk,
                ta_tamat,
                status,
                lanjut_ke,
                nama_ort,
                nama_ibu,
                nm_wali,
                alamat_ort,
                tlp_ayah,
                tlp_ibu,
                pekerjaan_ayah,
                pekerjaan_ibu,
                pkerja_wali,
                phasil_ayah,
                phasil_ibu,
                mail_ort,
                suku,
            } = row;

            // Cek apakah data dengan ID atau NIS yang sama sudah ada
            let existingSantri = await prisma.santri.findFirst({
                where: {
                    id: id_santri,
                    nis,
                },
            });

            if (!existingSantri) {
                // Proses tanggal lahir
                const tglLahir = tgl_lahir !== '-' && bln_lahir !== '-' && tahun_lahir !== '-'
                    ? `${tahun_lahir}-${bulanToNumber[bln_lahir]}-${tgl_lahir.padStart(2, '0')}`
                    : null;

                // Proses tanggal masuk
                const tglMasuk = tgl_masuk !== '-' && bln_masuk !== '-' && thn_masuk !== '-'
                    ? `${thn_masuk}-${bulanToNumber[bln_masuk]}-${tgl_masuk.padStart(2, '0')}`
                    : null;

                // Proses tanggal keluar
                const tglKeluar = tgl_keluar !== '-' && bln_keluar !== '-' && thn_keluar !== '-'
                    ? `${thn_keluar}-${bulanToNumber[bln_keluar]}-${tgl_keluar.padStart(2, '0')}`
                    : null;

                // Normalisasi jenis kelamin
                let jenisKelamin = jkl ? jkl.toUpperCase() : null;
                if (jenisKelamin !== 'L' && jenisKelamin !== 'P') {
                    console.log(`Jenis kelamin tidak valid untuk NIS ${nis}: ${jenisKelamin}. Set ke null.`);
                    jenisKelamin = null;
                }

                // Mapping status
                const statusSantri = statusMapping[status?.toLowerCase()] || null;

                // Buat data santri baru
                existingSantri = await prisma.santri.create({
                    data: {
                        id: id_santri,
                        nisn: nis_nasional,
                        nis,
                        nama,
                        foto: foto_st,
                        jk: jenisKelamin,
                        tempat_ttl: tempat_lahir,
                        tgl_ttl: tglLahir ? new Date(tglLahir) : null,
                        agama,
                        kesukuan,
                        anak_ke: anak_ke ? parseInt(anak_ke) : null,
                        tinggi: tinggi ? parseFloat(tinggi) : null,
                        berat: berat ? parseFloat(berat) : null,
                        gol_darah: g_darah,
                        hobi: hoby,
                        email,
                        status: statusSantri,
                        warna_kulit,
                    },
                });

                // Tambahkan data ke tabel santri_kesehatan
                await prisma.santri_kesehatan.create({
                    data: {
                        id_santri: existingSantri.id,
                        riwayat_penyakit: penyakit || null,
                    },
                });

                // Tambahkan data ke tabel santri_kontak
                await prisma.santri_kontak.create({
                    data: {
                        id_santri: existingSantri.id,
                        telepon: telpon || null,
                        alamat: alamat || null,
                        provinsi: propinsi || null,
                        kota: kota || null,
                        kode_pos: pos || null,
                    },
                });

                // Tambahkan data ke tabel santri_pendidikan
                await prisma.santri_pendidikan.create({
                    data: {
                        id_santri: existingSantri.id,
                        asal_sekolah: asal_sekolah || null,
                        alamat_sekolah: asl_skl || null,
                        no_skhun: no_skhun || null,
                        tahun_skhun: tahun_shkun ? parseInt(tahun_shkun) : null,
                        nomor_ujian_sd: n_ujian_sd || null,
                        nomor_ujian_smp: n_ujian_smp || null,
                    },
                });

                // Tambahkan data ke tabel santri_status
                await prisma.santri_status.create({
                    data: {
                        id_santri: existingSantri.id,
                        tahun_ajaran_masuk: thn_ajaranmsk || null,
                        tahun_ajaran_tamat: ta_tamat || null,
                        tgl_masuk: tglMasuk ? new Date(tglMasuk) : null,
                        tgl_keluar: tglKeluar ? new Date(tglKeluar) : null,
                        pindahan: pindahan === '1' ? true : pindahan === '0' ? false : null,
                        alasan_pindah: alasan_pindah || null,
                        lanjut_ke: lanjut_ke || null,
                    },
                });

                // Tambahkan data ke tabel santri_keluarga
                await prisma.santri_keluarga.create({
                    data: {
                        id_santri: existingSantri.id,
                        nama_ayah: nama_ort || null,
                        nama_ibu: nama_ibu || null,
                        nama_wali: nm_wali || null,
                        pendidikan_ayah: null, // Tidak ada kolom di tb_santri
                        pendidikan_ibu: null,  // Tidak ada kolom di tb_santri
                        pekerjaan_ayah: pekerjaan_ayah || null,
                        pekerjaan_ibu: pekerjaan_ibu || null,
                        pekerjaan_wali: pkerja_wali || null,
                        suku_marga: suku || null,
                        alamat: alamat_ort || null,
                        telepon_ayah: tlp_ayah || null,
                        telepon_ibu: tlp_ibu || null,
                        penghasilan_ayah: phasil_ayah || null,
                        penghasilan_ibu: phasil_ibu || null,
                        email_ayah: mail_ort || null,
                    },
                });

                console.log(`Data dengan NIS ${nis} berhasil ditambahkan ke semua tabel.`);
            } else {
                console.log(`Data dengan NIS ${nis} sudah ada. Melanjutkan pengecekan rombel.`);
            }

            // Proses untuk tabel ref_tahun_ajaran dan data_rombel
            const tahunAjaran = thn_ajaranmsk?.split('/') || [];
            const tahunMulai = tahunAjaran[0] ? parseInt(tahunAjaran[0]) : null;
            const tahunSelesai = tahunAjaran[1] ? parseInt(tahunAjaran[1]) : null;

            if (tahunMulai && tahunSelesai) {
                let tahunAjaranRecord = await prisma.ref_tahun_ajaran.findFirst({
                    where: {
                        tahun_mulai: tahunMulai,
                        tahun_selesai: tahunSelesai,
                    },
                });

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

                let rombelRecord = await prisma.data_rombel.findFirst({
                    where: {
                        nama: kelas_st,
                        id_tahun_ajaran: tahunAjaranRecord.id,
                    },
                });

                if (!rombelRecord) {
                    rombelRecord = await prisma.data_rombel.create({
                        data: {
                            nama: kelas_st,
                            id_tahun_ajaran: tahunAjaranRecord.id,
                            status: 'aktif',
                        },
                    });
                }

                const existingAnggotaRombel = await prisma.data_rombel_anggota.findFirst({
                    where: {
                        id_santri: existingSantri.id,
                        id_rombel: rombelRecord.id,
                    },
                });

                if (!existingAnggotaRombel) {
                    await prisma.data_rombel_anggota.create({
                        data: {
                            id_rombel: rombelRecord.id,
                            id_santri: existingSantri.id,
                            status: 'aktif',
                        },
                    });
                    console.log(`Data santri dengan NIS ${nis} ditambahkan ke rombel ${kelas_st}.`);
                } else {
                    console.log(`Data santri dengan NIS ${nis} sudah ada di rombel ${kelas_st}.`);
                }
            }
        }

        res.status(200).json({ message: 'Data migrated successfully' });
    } catch (error) {
        console.log(error);
        next(error);
    }
};