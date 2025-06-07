import crypto from "crypto";
import { config } from "./config/index.js";
import { AppError } from "./middleware/errorHandler.js";
import ejs from "ejs";
import wkhtmltopdf from "wkhtmltopdf";
import { JWTService } from "./services/jwt.service.js";
import { prisma } from "./prisma.js";

const algorithm = "aes-256-cbc";
const secret = config.secretKey;

if (!secret) {
	throw new Error("Encryption secret key is not configured");
}

const secretKey = crypto
	.createHash("sha256")
	.update(String(secret))
	.digest("base64")
	.substr(0, 32); // Ensure the key is 32 bytes
const ivLength = 16; // For AES, this is always 16

export const encrypt = (text) => {
	if (!text) {
		throw new AppError("Cannot encrypt undefined or empty value", 400);
	}
	try {
		const iv = crypto.randomBytes(ivLength);
		const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
		const encrypted = Buffer.concat([
			cipher.update(String(text), "utf8"),
			cipher.final(),
		]);
		return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
	} catch (error) {
		throw new AppError("Encryption failed: " + error.message, 500);
	}
};

export const decrypt = (encryptedText) => {
	if (!encryptedText) {
		throw new AppError("Cannot decrypt undefined or empty value", 400);
	}
	try {
		const parts = encryptedText.split(":");
		if (parts.length !== 2) {
			throw new AppError("Invalid encrypted text format", 400);
		}
		const [ivHex, encrypted] = parts;
		const iv = Buffer.from(ivHex, "hex");
		const encryptedTextBuffer = Buffer.from(encrypted, "hex");
		const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
		const decrypted = Buffer.concat([
			decipher.update(encryptedTextBuffer),
			decipher.final(),
		]);
		return decrypted.toString("utf8");
	} catch (error) {
		if (error instanceof AppError) {
			throw error;
		}
		throw new AppError("Decryption failed: " + error.message, 500);
	}
};

export const trimmedString = (str) => {
	if (typeof str !== "string") {
		throw new AppError("Input must be a string", 400);
	}
	return str.trim();
};

export const getTokenPayload = async (req) => {
	const token = req.headers.authorization?.split(" ")[1];

	if (!token) {
		throw new AppError("Unauthorized", 401);
	}
	const decoded = JWTService.decodeToken(token);
	const semesterId = Number(decoded.semester);
	if (!Number.isInteger(semesterId)) {
		throw new AppError("Invalid token: Semester id is not a number", 400);
	}

	const semester = await prisma.ref_semester.findUnique({
		where: { id: semesterId },
	});

	if (!semester) {
		throw new AppError("Invalid token: Missing semester", 400);
	}

	// Ambil tahun ajaran aktif
	const tahunAjaran = await prisma.ref_tahun_ajaran.findFirst({
		where: { id: semester.id_tahun_ajaran },
	});
	if (!tahunAjaran) {
		return res.status(404).json({ message: "Academic year not found" });
	}

	const user = await prisma.users.findFirst({
		where: { id: parseInt(decoded.userId) },
	});

	return { decoded, semester, tahunAjaran, user };
};
