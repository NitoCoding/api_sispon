import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../prisma.js';
import mysql from 'mysql2/promise';

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

// Get All Santri
export const getAllSantri = async (req, res, next) => {
    try {
        const santri = await prisma.santri.findMany();



        console.log(santri.length);

        res.status(200).json(santri);
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

        // Loop melalui setiap baris data dan masukkan ke tabel baru
        for (const row of rows) {
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
            } = row;

            // Cek apakah data dengan NIS yang sama sudah ada di database baru
            const existingSantri = await prisma.santri.findFirst({
                where: { nis },
            });

            // Jika NIS sudah ada, skip proses insert
            if (existingSantri) {
                console.log(`Data dengan NIS ${nis} sudah ada. Skip proses insert.`);
                continue;
            }

            // Proses penggabungan tanggal lahir
            const tglLahir = tgl_lahir !== '-' && bln_lahir !== '-' && tahun_lahir !== '-'
                ? `${tahun_lahir}-${bulanToNumber[bln_lahir]}-${tgl_lahir.padStart(2, '0')}` // Format: YYYY-MM-DD
                : null; // Jika tidak valid, set null

            // Normalisasi jenis kelamin (jkl) ke huruf kapital
            const jenisKelamin = jkl ? jkl.toUpperCase() : null; // Konversi ke huruf kapital
            console.log({nis, nama, jenisKelamin, agama});
            // Validasi jenis kelamin
            if (jenisKelamin !== 'L' && jenisKelamin !== 'P') {
                console.log(`Jenis kelamin tidak valid untuk NIS ${nis}: ${jenisKelamin}. Skip proses insert.`);
                jenisKelamin = null;
            }

            // Mapping status
            const statusSantri = statusMapping[status.toLowerCase()] || null; // Default jika status tidak valid

            // Buat data santri baru di tabel baru
            await prisma.santri.create({
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
        }

        res.status(200).json({ message: 'Data migrated successfully' });
    } catch (error) {
        console.log(error);
        next(error);
    }
};