import { prisma } from '../prisma.js';
import mysql from 'mysql2/promise';
import {JWTService} from "../services/jwt.service.js";
import {fileURLToPath} from "url";
import {dirname, join} from "path";
import { promises as fs } from 'fs';
import {getTokenPayload} from "../helpers.js";

// Create Guru Pegawai
export const createGuruPegawai = async (req, res, next) => {
    try {
        const {
            nip,
            tahun_terdaftar,
            nama_gp,
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
        } = JSON.parse(req.body.data);

        const foto_gp = req.file ? `/uploads/${req.baseUrl === '/santris' ? 'foto_santri' : 'foto_guru_pegawai'}/${req.file.filename}` : "";

        // Buat guru pegawai baru
        const newGuruPegawai = await prisma.guru_pegawai.create({
            data: {
                nip,
                tahun_terdaftar,
                nama_gp,
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
        const guruPegawai = await prisma.guru_pegawai.findMany({
            orderBy: {
                nama_gp: 'asc', // Sort by nama_gp in ascending order
            },
        });

        if (guruPegawai.length === 0) {
            return res.status(200).json({ message: "No guru_pegawai found", data: [] });
        }

        res.status(200).json(guruPegawai);
    } catch (error) {
        next(error);
    }
};

export const getIsWaliGuruPegawai = async (req, res, next) => {
    try {

        const { decoded, semester, tahunAjaran } = await getTokenPayload(req);

        const guruPegawai = await prisma.guru_pegawai.findMany({
            select: {
                id: true,
                nama_gp: true,
            },
        });

        // Fetch all data_rombel records to get wali_kelas IDs in one query
        const rombelWali = await prisma.data_rombel.findMany({
            select: {
                id_wali_kelas: true,
            },
            where: {
                id_tahun_ajaran: semester.id_tahun_ajaran,
            }
        });

        // Create a Set of id_wali_kelas for efficient lookup
        const waliKelasIds = new Set(rombelWali.map((rombel) => rombel.id_wali_kelas));

        // Map guru_pegawai to the desired response format
        const waliList = guruPegawai
            .map((guru) => ({
                id: guru.id,
                nama_gp: guru.nama_gp,
                isWali: waliKelasIds.has(guru.id),
            }))
            .sort((a, b) => a.nama_gp.localeCompare(b.nama_gp));

        // Return the response
        return res.status(200).json(waliList);
    } catch (error) {
        next(error);
    }
};

export const getAllGuruPegawaiLogin = async (req, res, next) => {
    try {
        const guruPegawai = await prisma.guru_pegawai.findMany({
            select: {
                id: true,
                nama_gp: true
            },
            orderBy: {
                nama_gp: 'asc', // Sort by nama_gp in ascending order
            },
        });

        res.status(200).json(guruPegawai);
    } catch (error) {
        next(error);
    }
};

export const getGuruPegawaiById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const guruPegawai = await prisma.guru_pegawai.findUnique({
            where: { id: parseInt(id) },
        });

        if (!guruPegawai) {
            return res.status(404).json({ message: 'Guru Pegawai not found' });
        }
    }

    static getAllGuruPegawai = async (req, res, next) => {
        try {
            const guruPegawai = await prisma.guru_pegawai.findMany();
    
            res.status(200).json(guruPegawai);
        } catch (error) {
            next(error);
        }
    };

    static getGuruPegawaiById = async (req, res, next) => {
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

    static getGuruPegawaiDetails = async (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(" ")[1];
    
            if (!token) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const userId = JWTService.decodeToken(token).userId;
    
            const user = await prisma.users.findUnique({
                where: { id: userId }
            })
    
            const guruPegawai = await prisma.guru_pegawai.findUnique({
                where: { id: parseInt(user.kode_pegawai) },
            });
    
            if (!guruPegawai) {
                return res.status(404).json({ message: 'Guru Pegawai not found' });
            }
    
            res.status(200).json(guruPegawai);
        } catch (error) {
            next(error);
        }
    };

    static updateGuruPegawaiDetails = async (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(" ")[1];
            if (!token) {
                return res.status(401).json({ message: "Unauthorized" });
            }
    
            const userId = JWTService.decodeToken(token).userId;
            const user = await prisma.users.findUnique({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
    
            const existingGuruPegawai = await prisma.guru_pegawai.findUnique({
                where: { id: parseInt(user.kode_pegawai) },
            });
    
            if (!existingGuruPegawai) {
                return res.status(404).json({ message: "Guru Pegawai not found" });
            }
    
            const fotoDb = await prisma.guru_pegawai.findFirst({
                where: { id: parseInt(user.kode_pegawai) },
                select: { foto_gp: true },
            });
    
            const requestData = req.body.data ? JSON.parse(req.body.data) : {};
            const allowedFields = [
                "nip", "tahun_terdaftar", "nama_gp", "jk", "tempat_ttl", "tgl_ttl",
                "status_pernikahan", "jumlah_anak", "pendidikan", "jabatan", "ket_jabatan",
                "status_gp", "status_kp", "unit", "alamat", "telepon"
            ];
    
            const updateData = {};
            for (const field of allowedFields) {
                if (requestData.hasOwnProperty(field)) {
                    updateData[field] = requestData[field];
                }
            }
    
            // Handle foto_gp
            if (req.file) {
                updateData.foto_gp = `/uploads/${req.baseUrl === '/santris' ? 'foto_santri' : 'foto_guru_pegawai'}/${req.file.filename}`;
    
                if (fotoDb.foto_gp) {
                    try {
                        const __filename = fileURLToPath(import.meta.url);
                        const __dirname = dirname(__filename);
                        const filePath = join(__dirname, '../../..', fotoDb.foto_gp.replace('/uploads/', 'uploads/'));
                        await fs.unlink(filePath);
                    } catch (err) {
                        console.error(`Failed to delete old photo: ${err.message}`);
                    }
                }
            }
    
            // Update only provided fields
            const updatedGuruPegawai = await prisma.guru_pegawai.update({
                where: { id: parseInt(user.kode_pegawai) },
                data: updateData,
            });
    
            res.status(200).json(updatedGuruPegawai);
        } catch (error) {
            console.error(error);
            next(error);
        }
    };
    
    static updateGuruPegawai = async (req, res, next) => {
        try {
            const { id } = req.params;
    
            const existingGuruPegawai = await prisma.guru_pegawai.findUnique({
                where: { id: parseInt(id) },
            });
    
            if (!existingGuruPegawai) {
                return res.status(404).json({ message: "Guru Pegawai not found" });
            }
    
            const fotoDb = await prisma.guru_pegawai.findFirst({
                where: { id: parseInt(id) },
                select: { foto_gp: true },
            });
    
            const requestData = req.body.data ? JSON.parse(req.body.data) : {};
            const allowedFields = [
                "nip", "tahun_terdaftar", "nama_gp", "jk", "tempat_ttl", "tgl_ttl",
                "status_pernikahan", "jumlah_anak", "pendidikan", "jabatan", "ket_jabatan",
                "status_gp", "status_kp", "unit", "alamat", "telepon"
            ];
    
            const updateData = {};
            for (const field of allowedFields) {
                if (requestData.hasOwnProperty(field)) {
                    updateData[field] = requestData[field];
                }
            }
    
            if (req.file) {
                updateData.foto_gp = `/uploads/${req.baseUrl === '/santris' ? 'foto_santri' : 'foto_guru_pegawai'}/${req.file.filename}`;
    
                if (fotoDb.foto_gp) {
                    try {
                        const __filename = fileURLToPath(import.meta.url);
                        const __dirname = dirname(__filename);
                        const filePath = join(__dirname, '../../..', fotoDb.foto_gp.replace('/uploads/', 'uploads/'));
                        await fs.unlink(filePath);
                    } catch (err) {
                        console.error(`Failed to delete old photo: ${err.message}`);
                    }
                }
            }
    
            const result = await prisma.$transaction(async (prisma) => {
                return await prisma.guru_pegawai.update({
                    where: { id: parseInt(id) },
                    data: updateData,
                });
            });
    
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    static deleteGuruPegawai = async (req, res, next) => {
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

    static migrateGuruPegawai = async (req, res, next) => {
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
}

