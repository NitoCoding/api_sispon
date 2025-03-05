import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../prisma.js';
import mysql from 'mysql2/promise';

// Create Guru Pegawai
export const createGuruPegawai = async (req, res, next) => {
    try {
        const {
            nip,
            tahun_terdaftar,
            nama_gp,
            foto_gp,
            jk,
            tempat_ttl,
            tgl_ttl,
            status_pernikahan,
            jumlah_anak,
            pendidikan,
            jabatan,
            ket_jabatan,
            status_gp,
            status_kp,
            unit,
            alamat,
            telepon,
        } = req.body;

        // Buat guru pegawai baru
        const newGuruPegawai = await prisma.guru_pegawai.create({
            data: {
                nip,
                tahun_terdaftar,
                nama_gp,
                foto_gp,
                jk,
                tempat_ttl,
                tgl_ttl,
                status_pernikahan,
                jumlah_anak,
                pendidikan,
                jabatan,
                ket_jabatan,
                status_gp,
                status_kp,
                unit,
                alamat,
                telepon,
            },
        });

        res.status(201).json({ message: 'Guru Pegawai created successfully', guru_pegawai: newGuruPegawai });
    } catch (error) {
        next(error);
    }
};

// Get All Guru Pegawai
export const getAllGuruPegawai = async (req, res, next) => {
    try {
        const guruPegawai = await prisma.guru_pegawai.findMany();

        res.status(200).json(guruPegawai);
    } catch (error) {
        next(error);
    }
};

// Get Guru Pegawai by ID
export const getGuruPegawaiById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const guruPegawai = await prisma.guru_pegawai.findUnique({
            where: { id: parseInt(id) },
        });

        if (!guruPegawai) {
            return res.status(404).json({ message: 'Guru Pegawai not found' });
        }

        res.status(200).json(guruPegawai);
    } catch (error) {
        next(error);
    }
};

// Update Guru Pegawai
export const updateGuruPegawai = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            nip,
            tahun_terdaftar,
            nama_gp,
            foto_gp,
            jk,
            tempat_ttl,
            tgl_ttl,
            status_pernikahan,
            jumlah_anak,
            pendidikan,
            jabatan,
            ket_jabatan,
            status_gp,
            status_kp,
            unit,
            alamat,
            telepon,
        } = req.body;

        // Cek apakah guru pegawai ada
        const existingGuruPegawai = await prisma.guru_pegawai.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingGuruPegawai) {
            return res.status(404).json({ message: 'Guru Pegawai not found' });
        }

        // Update guru pegawai
        const updatedGuruPegawai = await prisma.guru_pegawai.update({
            where: { id: parseInt(id) },
            data: {
                nip,
                tahun_terdaftar,
                nama_gp,
                foto_gp,
                jk,
                tempat_ttl,
                tgl_ttl,
                status_pernikahan,
                jumlah_anak,
                pendidikan,
                jabatan,
                ket_jabatan,
                status_gp,
                status_kp,
                unit,
                alamat,
                telepon,
            },
        });

        res.status(200).json({ message: 'Guru Pegawai updated successfully', guru_pegawai: updatedGuruPegawai });
    } catch (error) {
        next(error);
    }
};

// Delete Guru Pegawai
export const deleteGuruPegawai = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Cek apakah guru pegawai ada
        const existingGuruPegawai = await prisma.guru_pegawai.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingGuruPegawai) {
            return res.status(404).json({ message: 'Guru Pegawai not found' });
        }

        // Hapus guru pegawai
        await prisma.guru_pegawai.delete({
            where: { id: parseInt(id) },
        });

        res.status(200).json({ message: 'Guru Pegawai deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const migrateGuruPegawai = async (req, res, next) => {
    try {
        // Konfigurasi koneksi ke database lama
        const connection = await mysql.createConnection({
            host: process.env.OLD_DB_HOST, // Host database lama
            user: process.env.OLD_DB_USER, // User database lama
            password: process.env.OLD_DB_PASSWORD, // Password database lama
            database: process.env.OLD_DB_NAME, // Nama database lama
        });

        // Ambil semua data dari tabel lama
        const [rows] = await connection.execute('SELECT * FROM guru_pegawai'); // Ganti dengan nama tabel lama

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

        // Loop melalui setiap baris data dan masukkan ke tabel baru
        for (const row of rows) {
            const {
                id_gp,
                nip,
                thn_trdaftar,
                nama_gp,
                foto_gp,
                jkl_gp,
                tempat_ttl,
                tgl_ttl,
                bln_ttl,
                thn_ttl,
                status_pernikahan,
                jml_anak,
                pendidikan,
                Jabatan,
                ket_jabatan,
                status_pg,
                status_kp,
                unit,
                alamat,
                telpon,
            } = row;

            // Cek apakah data dengan NIP yang sama sudah ada di database baru
            const existingGuruPegawai = await prisma.guru_pegawai.findUnique({
                where: { nip },
            });

            // Jika NIP sudah ada, skip proses insert
            if (existingGuruPegawai) {
                console.log(`Data dengan NIP ${nip} sudah ada. Skip proses insert.`);
                continue;
            }

            // Proses penggabungan tanggal lahir
            const tglLahir = tgl_ttl !== '-' && bln_ttl !== '-' && thn_ttl !== '-'
                ? `${thn_ttl}-${bulanToNumber[bln_ttl]}-${tgl_ttl.padStart(2, '0')}` // Format: YYYY-MM-DD
                : null; // Jika tidak valid, set null

            // Buat data guru pegawai baru di tabel baru
            await prisma.guru_pegawai.create({
                data: {
                    id: id_gp, // Jika id_gp ingin dipertahankan
                    nip,
                    tahun_terdaftar: parseInt(thn_trdaftar) || null, // Konversi ke number, berikan null jika tidak valid
                    nama_gp,
                    foto_gp,
                    jk: jkl_gp,
                    tempat_ttl,
                    tgl_ttl: tglLahir ? new Date(tglLahir) : null, // Konversi ke DateTime atau null
                    status_pernikahan,
                    jumlah_anak: jml_anak,
                    pendidikan,
                    jabatan: Jabatan,
                    ket_jabatan,
                    status_gp: status_pg,
                    status_kp,
                    unit,
                    alamat,
                    telepon: telpon,
                },
            });

            console.log(`Data dengan NIP ${nip} berhasil ditambahkan.`);
        }

        res.status(200).json({ message: 'Data migrated successfully' });
    } catch (error) {
        next(error);
    }
};