import {JWTService} from '../services/jwt.service.js';
import {prisma} from '../prisma.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = JWTService.extractTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({ message: "Token tidak tersedia" });
    }

    // console.log("Authenticating someone...")

    let payload;
    try {
      payload = await JWTService.verifyToken(token);

      if (!payload.userId || !payload.semester) {
        return res.status(403).json({ message: "Token akses tidak valid" });
      }
      req.user = await prisma.users.findUnique({
        where: {id: payload.userId},
      });
      // console.log("Token valid & authenticated as", req.user);
    } catch (err) {
      if (err.message === "Token has expired") {
        // Token expired, coba refresh token
        const refreshTokenRecord = await prisma.refresh_token.findFirst({
          where: { userId: err.payload?.userId },
        });

        if (!refreshTokenRecord) {
          return res.status(403).json({ message: "Token pembaruan tidak ditemukan untuk pengguna ini" });
        }

        try {
          const refreshTokenPayload = await JWTService.verifyToken(refreshTokenRecord.token);

          const newAccessUser = await prisma.users.findUnique({
            where: { id: refreshTokenPayload.userId },
          });

          if (!newAccessUser) {
            return res.status(403).json({ message: "Pengguna tidak ditemukan" });
          }

          const newAccessToken = await JWTService.generateToken({
            userId: newAccessUser.id,
            semester: JWTService.decodeToken(token).semester,
          });
          req.user = newAccessUser;
          // console.log("Token invalid & authenticated as", req.user);
          res.setHeader("new-authorization", `Bearer ${newAccessToken}`);
          // return next();
            return res.status(401).json({ message: "Token telah kadaluwarsa" });
        } catch (refreshErr) {
          return res.status(403).json({ message: "Token pembaruan untuk pengguna ini tidak valid" });
        }
      }
      return res.status(403).json({ message: "Token tidak valid" });
    }

    next();
  } catch (err) {
    next(err);
  }
};

export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const roleId = req.user?.role_id;

      // console.log("Checking permission for userId:", userId, "and roleId:", roleId, "to access:", requiredPermission);

      if (!userId || !roleId) {
        return res.status(401).json({ message: 'Informasi role pengguna tidak ditemukan' });
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

      // console.log("Permissions for userId:", userId, "and roleId:", roleId, "are:", permissions);

      // Cek apakah requiredPermission ada di daftar izin
      const hasPermission = permissions.includes(requiredPermission);
      if (!hasPermission) {
        return res.status(403).json({ message: 'Pengguna tidak diizinkan mengakses fitur ini' });
      }

      // console.log("Permissions for userId:", userId, "to access:", requiredPermission, "is", hasPermission);

      next();
    } catch (error) {
      console.error('Error checking permission:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
};