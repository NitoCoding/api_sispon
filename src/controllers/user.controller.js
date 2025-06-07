import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../prisma.js';
import {encrypt, decrypt, getTokenPayload} from '../helpers.js';
import mysql from 'mysql2/promise';

// Create User
export const createUser = async (req, res, next) => {
  try {
    const { kode_pegawai, password, role_id} = req.body;

    // Encrypt password sebelum disimpan
    const encryptedPassword = encrypt(password);

    // Buat user baru
    const newUser = await prisma.users.create({
      data: {
        kode_pegawai,
        password: encryptedPassword, // Simpan password yang sudah dienkripsi
        role_id: parseInt(role_id), // Simpan role_id
      },
    });

    res.status(201).json({ message: 'Berhasil menambahkan pengguna', user: newUser });
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
        role_id: true,
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
        role_id: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
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
    const { kode_pegawai, password, role_id } = req.body;

    // Cek apakah user ada
    const existingUser = await prisma.users.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    // Encrypt password jika ada
    const encryptedPassword = password ? encrypt(password) : existingUser.password;

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: parseInt(id) },
      data: {
        kode_pegawai,
        password: encryptedPassword, // Simpan password yang sudah dienkripsi
        role_id,
      },
    });

    res.status(200).json({ message: 'User berhasil diperbarui', user: updatedUser });
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
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    // Hapus user
    await prisma.users.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: 'Pengguna berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

export const getUserRoles = async (req, res, next) => {
    try {
        const { decoded, semester, tahunAjaran } = await getTokenPayload(req);

        const login_account = await prisma.users.findFirst({
            where: {
              id: parseInt(decoded.userId),
            },
            include: {
              roles: true
            }
        });

        const account_list = await prisma.users.findMany({
            where: {
                AND: [
                    { kode_pegawai: parseInt(login_account.kode_pegawai) },
                    { NOT: [{ id: login_account.id }] },
                ]
            },
            include: {
              roles: true
            }
        });

        const { roles: login_roles, ...rest } = login_account;

        const roles_list = account_list.map((account) => {
            const { roles, ...rest } = account;
            return roles;
        });

        const result = {
          login_role: login_roles,
          another_role: roles_list,
        };

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export const fillRole = async (req, res, next) => {
  try {
``
    const kode = {
      'k': 'Kepala Sekolah',
      'r': 'Kurikulum',
      's': 'Kesantrian',
      'a': 'Kesiswaan',
      'u': 'Tatausaha',
      'g': 'Keuangan',
      'i': 'Wali Kelas',
      'p': 'Guru',
      'd': 'Administrator',
      'f': 'Wali Fiah'
    };

    const users = await prisma.users.findMany();
    for (const user of users) {
      const roleId = await prisma.roles.findFirst({
        where: {
          role_name: kode[user.role],
        }
      });
      if (roleId) {
        await prisma.users.update({
          where: { id: user.id },
          data: { role_id: roleId.id },
        });
      }
    }

    res.status(200).json("Role updated successfully");
  } catch (error) {
    next(error);
  }
}

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