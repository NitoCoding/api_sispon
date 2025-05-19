import { AppError } from "../middleware/errorHandler.js";
import { prisma } from "../prisma.js";

export class RoleController {
    static getAllRole = async (req, res, next) => {
        try {
            const roles = await prisma.roles.findMany({
                include: {
                    user: true,
                },
            });
            return res.status(200).json({
                success: true,
                message: "Get all roles successfully",
                data: roles,
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    };

    static getRoleById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const role = await prisma.roles.findUnique({
                where: { id: parseInt(id) },
                include: {
                    user: true,
                },
            });
            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: "Role not found",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Get role successfully",
                data: role,
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    };

    static createRole = async (req, res, next) => {
        try {
            const { name } = req.body;
            const role = await prisma.roles.create({
                data: {
                    name,
                },
            });
            return res.status(201).json({
                success: true,
                message: "Create role successfully",
                data: role,
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    };

    static updateRole = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { name } = req.body;
            const role = await prisma.roles.update({
                where: { id: parseInt(id) },
                data: {
                    name,
                },
            });
            return res.status(200).json({
                success: true,
                message: "Update role successfully",
                data: role,
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    };

    static deleteRole = async (req, res, next) => {
        try {
            const { id } = req.params;
            const role = await prisma.roles.delete({
                where: { id: parseInt(id) },
            });
            return res.status(200).json({
                success: true,
                message: "Delete role successfully",
                data: role,
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    };

    static getRoleByUserId = async (req, res, next) => {
        try {
            const { id } = req.params;
            const role = await prisma.roles.findMany({
                where: { id_user: parseInt(id) },
                include: {
                    users: true,
                },
            });
            return res.status(200).json({
                success: true,
                message: "Get role by user id successfully",
                data: role,
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    };



}