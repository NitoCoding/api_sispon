import { prisma } from "../prisma.js";
import mysql from 'mysql2/promise';

export class KelasController {
  static createKelas = async (req, res) => {
    try {
      const {
        kelas,
        kapasitas,
        jumlah_meja,
        meja_rusak,
        jumlah_kursi,
        kursi_rusak,
        jumlah_lemari,
        lemari_rusak,
        jumlah_ptulis,
        ptulis_rusak,
        proyektor,
      } = req.body;

      // Validate required fields
      if (!kelas) {
        return res.status(400).json({ message: "Kelas is required" });
      }

      let kode;
      let existingKelas;
      do {
        // Generate random 6-digit code
        kode = Math.floor(100000 + Math.random() * 900000);

        // Check if kode already exists
        existingKelas = await prisma.ref_kelas.findUnique({
          where: { kode },
        });
      } while (existingKelas); // Repeat if code exists

      const newKelas = await prisma.ref_kelas.create({
        data: {
          kode,
          kelas,
          kapasitas,
          jumlah_meja,
          meja_rusak,
          jumlah_kursi,
          kursi_rusak,
          jumlah_lemari,
          lemari_rusak,
          jumlah_ptulis,
          ptulis_rusak,
          proyektor,
        },
      });

      res.status(201).json(newKelas);
    } catch (error) {
      console.error("Error creating kelas:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  static getAllKelas = async (req, res) => {
    try {
      const kelas = await prisma.ref_kelas.findMany({
        include: {
          data_konfigurasi_biaya: true,
        },
      });
      res.json(kelas);
    } catch (error) {
      console.error("Error fetching kelas:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  static getKelasById = async (req, res) => {
    try {
      const { id } = req.params;
      const kelas = await prisma.ref_kelas.findUnique({
        where: { id: parseInt(id) },
        include: {
          data_konfigurasi_biaya: true,
        },
      });

      if (!kelas) {
        return res.status(404).json({ message: "Kelas not found" });
      }

      res.json(kelas);
    } catch (error) {
      console.error("Error fetching kelas:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  static updateKelas = async (req, res) => {
    try {
      const { id } = req.params;
      const {
        kode,
        kelas,
        kapasitas,
        jumlah_meja,
        meja_rusak,
        jumlah_kursi,
        kursi_rusak,
        jumlah_lemari,
        lemari_rusak,
        jumlah_ptulis,
        ptulis_rusak,
        proyektor,
      } = req.body;

      // Check if kelas exists
      const existingKelas = await prisma.ref_kelas.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingKelas) {
        return res.status(404).json({ message: "Kelas not found" });
      }

      // If kode is being updated, check if new kode already exists
      if (kode && kode !== existingKelas.kode) {
        const kodeExists = await prisma.ref_kelas.findUnique({
          where: { kode },
        });

        if (kodeExists) {
          return res.status(400).json({ message: "Kode kelas already exists" });
        }
      }

      const updatedKelas = await prisma.ref_kelas.update({
        where: { id: parseInt(id) },
        data: {
          kode,
          kelas,
          kapasitas,
          jumlah_meja,
          meja_rusak,
          jumlah_kursi,
          kursi_rusak,
          jumlah_lemari,
          lemari_rusak,
          jumlah_ptulis,
          ptulis_rusak,
          proyektor,
        },
      });

      res.json(updatedKelas);
    } catch (error) {
      console.error("Error updating kelas:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  static deleteKelas = async (req, res) => {
    try {
      const { id } = req.params;

      // Check if kelas exists
      const existingKelas = await prisma.ref_kelas.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingKelas) {
        return res.status(404).json({ message: "Kelas not found" });
      }

      // Check if kelas has any related data_konfigurasi_biaya
      const hasRelatedData = await prisma.data_konfigurasi_biaya.findFirst({
        where: { id_kelas: parseInt(id) },
      });

      if (hasRelatedData) {
        return res.status(400).json({
          message: "Cannot delete kelas with related configuration data",
        });
      }

      await prisma.ref_kelas.delete({
        where: { id: parseInt(id) },
      });

      res.json({ message: "Kelas deleted successfully" });
    } catch (error) {
      console.error("Error deleting kelas:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  static migrateKelas = async (req, res, next) => {
    try {
      // Konfigurasi koneksi ke database lama
      const connection = await mysql.createConnection({
        host: process.env.OLD_DB_HOST, // Host database lama
        user: process.env.OLD_DB_USER, // User database lama
        password: process.env.OLD_DB_PASSWORD, // Password database lama
        database: process.env.OLD_DB_NAME, // Nama database lama
      });

      // Ambil semua data dari tabel `master_kelas` di database lama
      const [rows] = await connection.execute('SELECT * FROM master_kelas');

      // Tutup koneksi ke database lama
      await connection.end();

      // Loop melalui setiap baris data dan masukkan ke tabel baru
      for (const row of rows) {
        const {
          kd_kls,       // Kolom kode kelas
          kelas,        // Nama kelas
          kapasitas,    // Kapasitas kelas
          jml_meja,     // Jumlah meja
          meja_r,       // Meja rusak
          jml_kursi,    // Jumlah kursi
          kursi_r,      // Kursi rusak
          jml_lemari,   // Jumlah lemari
          lrusak,       // Lemari rusak
          jml_ptulis,   // Jumlah papan tulis
          prusak,       // Papan tulis rusak
          proyektor,    // Jumlah proyektor
        } = row;

        // Migrasi data ke tabel `ref_kelas`
        await prisma.ref_kelas.create({
          data: {
            kode: kd_kls,
            kelas: kelas,
            kapasitas: parseInt(kapasitas),
            jumlah_meja: parseInt(jml_meja),
            meja_rusak: parseInt(meja_r),
            jumlah_kursi: parseInt(jml_kursi),
            kursi_rusak: parseInt(kursi_r),
            jumlah_lemari: parseInt(jml_lemari),
            lemari_rusak: parseInt(lrusak),
            jumlah_ptulis: parseInt(jml_ptulis),
            ptulis_rusak: parseInt(prusak),
            proyektor: parseInt(proyektor),
          },
        });
      }

      // Kirim respons sukses
      res.status(200).json({ message: 'Data kelas migrated successfully' });
    } catch (error) {
      // Jika terjadi error, tangani dengan middleware error handling
      next(error);
    }
  };


}
