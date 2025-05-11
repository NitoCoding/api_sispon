import { AppError } from "../middleware/errorHandler.js";
import { JWTService } from "../services/jwt.service.js";
import { encrypt, decrypt } from "../helpers.js";
import { prisma } from "../prisma.js";
import { get } from "mongoose";

export class AuthController {
	static changeRole = async (req, res, next) => {
		try {
			const { id_role } = req.params;

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

      console.log("decodedToken", decodedToken);
      // console.log("id", decodedToken.userId);
      const userId = decodedToken.userId;
			const get_data_user = await prisma.users.findFirst({
				where: { id: userId },
			});
      console.log("get_data_user", get_data_user);

			const get_assigned_role = await prisma.users.findMany({
				where: { kode_pegawai: get_data_user.kode_pegawai },
			});

			let payload = {
				userId: decodedToken.userId,
				semester: decodedToken.semester,
			};

			if (get_assigned_role.length > 0) {
				for (let i = 0; i < get_assigned_role.length; i++) {
					if (get_assigned_role[i].role == id_role) {
						payload.userId = get_assigned_role[i].id;
						break; // Keluar dari loop setelah menemukan user yang valid
					}
				}
			}

			const currentTime = Math.floor(Date.now() / 1000);
			const expiresAt = decodedToken.exp;
			const remainingTime = expiresAt - currentTime;

			if (remainingTime <= 0) {
				return res
					.status(401)
					.json({ message: "Token has already expired" });
			}

			const newAccessToken = await JWTService.generateToken(
				payload,
				`${remainingTime}s`
			);

			console.log(JWTService.decodeToken(newAccessToken));

			res.setHeader("new-authorization", `Bearer ${newAccessToken}`);
			res.json({
				message: "Semester updated successfully",
			});
		} catch (error) {
			next(new AppError(error.message, 500));
		}
	};

	static login = async (req, res, next) => {
		const { pegId, password } = req.body;
		const semester = await prisma.ref_semester.findFirst({
			where: {
				id_master_kategori_status_ref_semester: 11,
			},
		});
		// console.log(semester);
		if (!pegId || !password) {
			return res.status(400).json({ message: "Missing required fields" });
		}

		try {
			// Cari semua user yang terkait dengan userId (pegawai)
			const users = await prisma.users.findMany({
				where: { kode_pegawai: pegId },
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
			const accessToken = await JWTService.generateToken({
				userId: validUser.id,
				semester: semester.id,
			});
			const refreshToken = await JWTService.generateToken(
				{ userId: validUser.id },
				"7d"
			);
			const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

			// Hapus semua token refresh lama milik user dari database
			await prisma.refresh_token.deleteMany({
				where: { userId: validUser.id },
			});

			// Tambahkan token refresh baru ke database
			await prisma.refresh_token.create({
				data: { token: refreshToken, userId: validUser.id, expiresAt },
			});

			// Kirim token ke client
			res.json({ access_token: accessToken });
		} catch (error) {
			next(error);
		}
	};

	static chooseSemester = async (req, res, next) => {
		try {
			const { id_semester } = req.params;

			let currentToken = JWTService.extractTokenFromHeader(req);

			const newPreviewsToken = res.getHeader("new-authorization");

			// check if semester is valid
			const semester = await prisma.ref_semester.findFirst({
				where: {
					id: parseInt(id_semester),
				},
			});

			if (!semester) {
				return res.status(404).json({ message: "Semester not found" });
			}

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
				semester: id_semester,
			};

			const currentTime = Math.floor(Date.now() / 1000);
			const expiresAt = decodedToken.exp;
			const remainingTime = expiresAt - currentTime;

			if (remainingTime <= 0) {
				return res
					.status(401)
					.json({ message: "Token has already expired" });
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
	};

	static logout = async (req, res, next) => {
		try {
			// TODO: Add token blacklisting logic here
			res.status(200).json({
				status: "success",
				message: "Successfully logged out",
			});
		} catch (error) {
			next(error);
		}
	};
}
