import { body, param } from "express-validator";
import { createValidation } from "../middleware/validate.middleware.js";

export const createKategoriKarakterValidation = createValidation([
	body("nama")
		.notEmpty()
		.withMessage("Nama is required")
		.isString()
		.withMessage("Nama must be a string")
		.trim()
		.isLength({ min: 2, max: 100 })
		.withMessage("Nama must be between 2 and 100 characters")
		.matches(/^[a-zA-Z0-9\s\-_]+$/)
		.withMessage(
			"Nama can only contain letters, numbers, spaces, hyphens, and underscores"
		),

	body("deskripsi")
		.notEmpty()
		.withMessage("Deskripsi is required")
		.isString()
		.withMessage("Deskripsi must be a string")
		.trim()
		.isLength({ min: 0, max: 500 })
		.withMessage("Deskripsi max length 500 characters"),
]);

export const updateKategoriKarakterValidation = createValidation([
    param("id")
        .isInt({ min: 1 })
        .withMessage("ID must be a positive integer"),

    body("nama")
        .optional()
        .isString()
        .withMessage("Nama must be a string")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Nama must be between 2 and 100 characters")
        .matches(/^[a-zA-Z0-9\s\-_]+$/)
        .withMessage(
            "Nama can only contain letters, numbers, spaces, hyphens, and underscores"
        ),

    body("deskripsi")
        .optional()
        .isString()
        .withMessage("Deskripsi must be a string")
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage("Deskripsi max length 500 characters"),
]);

export const deleteKategoriKarakterValidation = createValidation([
    param("id")
        .isInt({ min: 1 })
        .withMessage("ID must be a positive integer"),
]);

// Validator untuk Kriteria Karakter
export const createKriteriaKarakterValidation = createValidation([
	body("kategori")
		.notEmpty()
		.withMessage("Kategori is required")
		.isInt({ min: 1 })
		.withMessage("Kategori must be a positive integer"),

	body("nama")
		.notEmpty()
		.withMessage("Nama is required")
		.isString()
		.withMessage("Nama must be a string")
		.trim()
		.isLength({ min: 2, max: 100 })
		.withMessage("Nama must be between 2 and 100 characters"),

	body("deskripsi")
		.notEmpty()
		.withMessage("Deskripsi is required")
		.isString()
		.withMessage("Deskripsi must be a string")
		.trim()
		.isLength({ min: 1, max: 500 })
		.withMessage("Deskripsi must be between 1 and 500 characters"),

	body("basis")
		.notEmpty()
		.withMessage("Basis is required")
		.isInt({ min: 1 })
		.withMessage("Basis must be a positive integer"),
]);

export const updateKriteriaKarakterValidation = createValidation([
	param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),

	body("kategori")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Kategori must be a positive integer"),

	body("nama")
		.optional()
		.isString()
		.withMessage("Nama must be a string")
		.trim()
		.isLength({ min: 2, max: 100 })
		.withMessage("Nama must be between 2 and 100 characters"),

	body("deskripsi")
		.optional()
		.isString()
		.withMessage("Deskripsi must be a string")
		.trim()
		.isLength({ min: 1, max: 500 })
		.withMessage("Deskripsi must be between 1 and 500 characters"),

	body("basis")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Basis must be a positive integer"),
]);

export const deleteKriteriaKarakterValidation = createValidation([
	param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
]);
