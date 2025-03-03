import { AppError } from '../middleware/errorHandler.js';
import { JWTService } from '../services/jwt.service.js';
import { compare } from 'bcrypt';
import { encrypt, decrypt } from '../helpers.js';
import { prisma } from '../prisma.js';

export const login = async (req, res, next) => {
  const { pegId, password } = req.body;
  if (!pegId || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Cari semua user yang terkait dengan userId (pegawai)
    const users = await prisma.users.findMany({ 
      where: { kode_pegawai: pegId } 
    });
    console.log(users);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cari user dengan password yang cocok
    let validUser = null;
    for (const user of users) {
      if (password === decrypt(user.password)) {
        validUser = user;
        break; // Keluar dari loop setelah menemukan user yang valid
      }
    }
    console.log(validUser);

    if (!validUser) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate access token dan refresh token
    const accessToken = await JWTService.generateToken({ userId: validUser.id, role: validUser.role });
    const refreshToken = await JWTService.generateToken({ userId: validUser.id }, '7d');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Hapus semua token refresh lama milik user dari database
    await prisma.RefreshToken.deleteMany({ where: { userId: validUser.id } });

    // Tambahkan token refresh baru ke database
    await prisma.RefreshToken.create({ data: { token: refreshToken, userId: validUser.id, expiresAt } });

    // Kirim token ke client
    res.json({ access_token: accessToken, refresh_token: refreshToken });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // TODO: Add user creation logic here
    // For demo purposes, we'll create a mock user
    const user = {
      id: 1,
      name,
      email,
      role: 'user'
    };

    // Generate tokens
    const { accessToken, refreshToken } = JWTService.generateTokens(user);

    res.status(201).json({
      status: 'success',
      data: {
        user,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    // TODO: Add token blacklisting logic here
    res.status(200).json({
      status: 'success',
      message: 'Successfully logged out'
    });
  } catch (error) {
    next(error);
  }
};