import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../prisma.js';
import { encrypt, decrypt } from '../helpers.js';
import mysql from 'mysql2/promise';

// Create User
export const createUser = async (req, res, next) => {
  try {
    const { kode_pegawai, password, role } = req.body;

    // Encrypt password sebelum disimpan
    const encryptedPassword = encrypt(password);

    // Buat user baru
    const newUser = await prisma.users.create({
      data: {
        kode_pegawai,
        password: encryptedPassword, // Simpan password yang sudah dienkripsi
        role,
      },
    });

    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    next(error);
  }
};

// Get All Users
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        kode_pegawai: true,
        role: true,
      },
    });

    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// Get User by ID
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.users.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        kode_pegawai: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Update User
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { kode_pegawai, password, role } = req.body;

    // Cek apakah user ada
    const existingUser = await prisma.users.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Encrypt password jika ada
    const encryptedPassword = password ? encrypt(password) : existingUser.password;

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: parseInt(id) },
      data: {
        kode_pegawai,
        password: encryptedPassword, // Simpan password yang sudah dienkripsi
        role,
      },
    });

    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// Delete User
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Cek apakah user ada
    const existingUser = await prisma.users.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hapus user
    await prisma.users.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const migrateUsers = async (req, res, next) => {
  try {
    // Konfigurasi koneksi ke database lama
    const connection = await mysql.createConnection({
      host: process.env.OLD_DB_HOST, // Host database lama
      user: process.env.OLD_DB_USER, // User database lama
      password: process.env.OLD_DB_PASSWORD, // Password database lama
      database: process.env.OLD_DB_NAME, // Nama database lama
    });

    // Ambil semua data dari tabel lama
    const [rows] = await connection.execute('SELECT * FROM tb_user');

    // Tutup koneksi ke database lama
    await connection.end();

    // Loop melalui setiap baris data dan masukkan ke tabel baru
    for (const row of rows) {
      const { kd_gp, pas2, ket } = row;

      // Hash password dari kolom `pas2`
      const hashedPassword = encrypt(pas2);

      // Buat user baru di tabel baru
      await prisma.users.create({
        data: {
          kode_pegawai: parseInt(kd_gp), // Konversi kd_gp ke number
          password: hashedPassword, // Simpan password yang sudah di-hash
          role: ket
        },
      });
    }

    res.status(200).json({ message: 'Data migrated successfully' });
  } catch (error) {
    next(error);
  }
};