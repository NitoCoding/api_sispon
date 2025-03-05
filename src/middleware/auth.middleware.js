import { JWTService } from '../services/jwt.service.js';
import { AppError } from './errorHandler.js';
import { config } from '../config/index.js';
import { prisma } from '../prisma.js';

export const authenticate = async (req, res, next) => {
  try {
    const secretKey = new TextEncoder().encode(config.jwtSecret);
    const token = JWTService.extractTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    let payload;
    try {
      payload  = await JWTService.verifyToken(token, secretKey);
      if (!payload.role) {
        return res.status(403).json({ message: "Invalid access token" });
      }
    } catch (err) {
      if (err.message === "Token has expired") {
        // Token expired, coba refresh token
        const refreshTokenRecord = await prisma.RefreshToken.findFirst({
          where: { userId: err.payload?.userId },
        });

        if (!refreshTokenRecord) {
          return res.status(403).json({ message: "No refresh token found for this user" });
        }

        try {
          const refreshTokenPayload = await JWTService.verifyToken(refreshTokenRecord.token, secretKey);

          const newAccessUser = await prisma.users.findUnique({
            where: { id: refreshTokenPayload.userId },
          });

          if (!newAccessUser) {
            return res.status(403).json({ message: "User not found" });
          }

          const newAccessToken = await JWTService.generateToken({
            userId: newAccessUser.id,
            role: newAccessUser.role,
          });

          req.user = newAccessUser;
          res.setHeader("new-authorization", `Bearer ${newAccessToken}`);
          return next();
        } catch (refreshErr) {
          return res.status(403).json({ message: "Invalid refresh token" });
        }
      }
      return res.status(403).json({ message: "Invalid token" });
    }

    // Jika token valid, lanjutkan dengan request
    req.user = payload;
    next();
  } catch (err) {
    res.status(500).json({ message: "Authentication failed", error: err.message });
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