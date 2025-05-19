import { body, param } from "express-validator";
import { createValidation } from "../middleware/validate.middleware.js";
export const deleteValidation = createValidation(

    [
        param("id")
		.exists()
		.withMessage("ID harus diisi")
		.bail()
		.isInt({ min: 1 })
		.withMessage("ID harus berupa bilangan bulat positif")
		.toInt(), // Sanitize: Convert to integer
    ]
    
)