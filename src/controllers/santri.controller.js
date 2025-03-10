import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../prisma.js';
import mysql from 'mysql2/promise';
import {JWTService} from "../services/jwt.service.js";

// Create Santri
export const createSantri = async (req, res, next) => {
    try {
        const {
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
        } = req.body;

        // Buat santri baru
        const newSantri = await prisma.santri.create({
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

        res.status(201).json({ message: 'Santri created successfully', santri: newSantri });
    } catch (error) {
        next(error);
    }
};

export const getAllSantri = async (req, res, next) => {
    try {
        const { groupbyclass, class: className } = req.query;
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = JWTService.decodeToken(token);
        const academicYear = decoded.academic_year;

        if (!academicYear) {
            return res.status(400).json({ message: "Invalid token: Missing academic year" });
        }

        // Get the active academic year ID
        const tahunAjaran = await prisma.ref_tahun_ajaran.findFirst({
            where: { id: academicYear },
        });

        if (!tahunAjaran) {
            return res.status(404).json({ message: "Academic year not found" });
        }

        const whereClause = {
            id_tahun_ajaran: tahunAjaran.id,
        };

        if (className) {
            whereClause["nama"] = className;
        }

        const rombels = await prisma.data_rombel.findMany({
            where: whereClause,
            include: {
                data_rombel_anggota: true
            }
        });

        let santriData = [];

        for (const rombel of rombels) {
            const anggotaIds = rombel.data_rombel_anggota.map(anggota => anggota.id_santri);
            const santriList = await prisma.santri.findMany({
                where: { id: { in: anggotaIds } }
            });

            const santriWithTahunAjaran = await Promise.all(santriList.map(async (santri) => {
                const status = await prisma.santri_status.findFirst({
                    where: { id_santri: santri.id },
                    select: { tahun_ajaran_masuk: true }
                });
                return { ...santri, tahun_ajaran_masuk: status?.tahun_ajaran_masuk || null };
            }));

            santriData.push({
                class: rombel.nama,
                students: santriWithTahunAjaran
            });
        }

        if (groupbyclass === "true") {
            return res.status(200).json(santriData);
        } else {
            return res.status(200).json(santriData.flatMap(item => item.students));
        }
    } catch (error) {
        next(error);
    }
};


// Get Santri by ID
export const getSantriById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const santri = await prisma.santri.findUnique({
            where: { id: parseInt(id) },
        });

        if (!santri) {
            return res.status(404).json({ message: 'Santri not found' });
        }

        res.status(200).json(santri);
    } catch (error) {
        next(error);
    }
};

// Update Santri
export const updateSantri = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
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
        } = req.body;

        // Cek apakah santri ada
        const existingSantri = await prisma.santri.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingSantri) {
            return res.status(404).json({ message: 'Santri not found' });
        }

        // Update santri
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

        res.status(200).json({ message: 'Santri updated successfully', santri: updatedSantri });
    } catch (error) {
        next(error);
    }
};

// Delete Santri
export const deleteSantri = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Cek apakah santri ada
        const existingSantri = await prisma.santri.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingSantri) {
            return res.status(404).json({ message: 'Santri not found' });
        }

        // Hapus santri
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
                nis_nasional,
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
                        nis_nasional,
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