import {JWTService} from '../services/jwt.service.js';
import {prisma} from '../prisma.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = JWTService.extractTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    let payload;
    try {
      payload  = await JWTService.verifyToken(token);
      if (!payload.userId || !payload.semester) {
        return res.status(403).json({ message: "Invalid access token" });
      }
      req.user = await prisma.users.findUnique({
        where: {id: payload.userId},
      });
      // console.log(payload)
      req.payload = payload;
    } catch (err) {
      console.log(err.message);
      if (err.message === "Token has expired") {
        // Token expired, coba refresh token
        const refreshTokenRecord = await prisma.refresh_token.findFirst({
          where: { userId: err.payload?.userId },
        });

        if (!refreshTokenRecord) {
          return res.status(403).json({ message: "No refresh token found for this user" });
        }

        try {
          const refreshTokenPayload = await JWTService.verifyToken(refreshTokenRecord.token);

          const newAccessUser = await prisma.users.findUnique({
            where: { id: refreshTokenPayload.userId },
          });

          if (!newAccessUser) {
            return res.status(403).json({ message: "User not found" });
          }

          const newAccessToken = await JWTService.generateToken({
            userId: newAccessUser.id,
            semester: JWTService.decodeToken(token).semester,
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

    next();
  } catch (err) {
    res.status(500).json({ message: "Authentication failed", error: err.message });
  }
};

export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const roleId = req.user?.role_id;

      if (!userId || !roleId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Ambil izin dari role_permissions
      const rolePermissions = await prisma.role_permissions.findMany({
        where: {
          role_id: roleId,
        },
        include: {
          permissions: {
            select: {
              permission_code: true,
            },
          },
        },
      });

      // Ambil izin sementara (temporary_permissions) untuk user atau role
      const temporaryPermissions = await prisma.temporary_permissions.findMany({
        where: {
          OR: [
            { user_id: userId },
            { role_id: roleId },
          ],
          AND: {
            start_date: { lte: new Date() },
            end_date: { gte: new Date() },
          },
        },
        include: {
          permissions: {
            select: {
              permission_code: true,
            },
          },
        },
      });

      // Gabungkan semua permission_code
      const permissions = [
        ...rolePermissions.map(rp => rp.permissions.permission_code),
        ...temporaryPermissions.map(tp => tp.permissions.permission_code),
      ];

      // Cek apakah requiredPermission ada di daftar izin
      const hasPermission = permissions.includes(requiredPermission);

      console.log('User permissions:', permissions);
      console.log('Has permission:', hasPermission);

      if (!hasPermission) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      next();
    } catch (error) {
      console.error('Error checking permission:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
};