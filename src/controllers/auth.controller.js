import { AppError } from '../middleware/errorHandler.js';
import { JWTService } from '../services/jwt.service.js';
import { encrypt, decrypt } from '../helpers.js';
import { prisma } from '../prisma.js';

export const login = async (req, res, next) => {
  const { pegId, password } = req.body;
  const semester = await prisma.ref_semester.findFirst({
    where: {
      status: 'aktif'
    }
  })
  console.log(semester);
  if (!pegId || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Cari semua user yang terkait dengan userId (pegawai)
    const users = await prisma.users.findMany({ 
      where: { kode_pegawai: pegId } 
    });

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cari user dengan password yang cocok
    let validUser;
    for (const user of users) {
      if (password === decrypt(user.password)) {
        validUser = user;
        break; // Keluar dari loop setelah menemukan user yang valid
      }
    }

    if (!validUser) {
      return res.status(401).json({ message: "Invalid password" });
    }
    // console.log(validUser.id);

    // Generate access token dan refresh token
    const accessToken = await JWTService.generateToken({ userId: validUser.id, role: validUser.role, semester: semester.id });
    const refreshToken = await JWTService.generateToken({ userId: validUser.id }, '7d');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Hapus semua token refresh lama milik user dari database
    await prisma.refresh_token.deleteMany({ where: { userId: validUser.id } });

    // Tambahkan token refresh baru ke database
    await prisma.refresh_token.create({ data: { token: refreshToken, userId: validUser.id, expiresAt } });

    // Kirim token ke client
    res.json({ access_token: accessToken });
  } catch (error) {
    next(error);
  }
};

export const chooseSemester = async (req, res, next) => {
  try {
    const { id_semester } = req.params;

    let currentToken = JWTService.extractTokenFromHeader(req);

    const newPreviewsToken = res.getHeader("new-authorization");

    if (newPreviewsToken) {
      console.log("newPreviewsToken", newPreviewsToken);
      currentToken = newPreviewsToken;
    }

    const decodedToken = JWTService.decodeToken(currentToken);
    if (!decodedToken) {
      return res.status(401).json({ message: "Invalid token" });
    }

    let currentPayload = {
      userId: decodedToken.userId,
      role: decodedToken.role,
      semester: id_semester
    };

    const currentTime = Math.floor(Date.now() / 1000);
    const expiresAt = decodedToken.exp;
    const remainingTime = expiresAt - currentTime;

    if (remainingTime <= 0) {
      return res.status(401).json({ message: "Token has already expired" });
    }

    const newAccessToken = await JWTService.generateToken(
        currentPayload,
        `${remainingTime}s`
    );

    console.log(JWTService.decodeToken(newAccessToken));

    res.setHeader("new-authorization", `Bearer ${newAccessToken}`);
    res.json({
      message: "Semester updated successfully",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
}

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