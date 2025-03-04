import { JWTService } from '../services/jwt.service.js';
import { AppError } from './errorHandler.js';
import { config } from '../config/index.js';
import { prisma } from '../prisma.js';

export const authenticate = async (req, res, next) => {
  try {
    const secretKey = new TextEncoder().encode(config.jwtSecret);

    const token = JWTService.extractTokenFromHeader(req);

    // Cek apakah token ada di PublicToken atau RefreshToken
    let payload;

    // Cek RefreshToken jika bukan PublicToken
    try {
      ({ payload } = await JWTService.verifyToken(token, secretKey));  // Verifikasi access token biasa
    } catch (err) {
      if (err.message === "Token has expired") {
        // Token expired, cek dan refresh token
        const refreshTokenRecord = await prisma.RefreshToken.findFirst({
          where: { userId: err.payload?.userId },
        });

        if (!refreshTokenRecord) {
          return res.status(403).json({ message: "No refresh token found for this user" });
        }

        // Verifikasi refresh token
        const refreshTokenPayload = await JWTService.verifyToken(refreshTokenRecord.token, secretKey);

        const newAccessUser = await prisma.users.findUnique({
          where: { id: refreshTokenPayload.userId },
        });

        // Generate a new access token
        const newAccessToken = await JWTService.generateToken({
          userId: newAccessUser.userId,
          role: newAccessUser.role,
        });

        req.user = newAccessUser;

        res.setHeader("new-authorization", `Bearer ${newAccessToken}`);
        return next();
      }
      return res.status(403).json({ message: "Invalid token" });
    }

    // Token valid untuk admin atau user terautentikasi
    req.user = payload;
    next();
  } catch (err) {
    res.status(403).json({ message: "Authentication failed" });
  }
};

// Optional: Role-based authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Not authorized to access this route', 403));
    }

    next();
  };
};