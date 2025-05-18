import { prisma } from '../prisma.js';
import { encrypt, decrypt } from '../helpers.js';
import mysql from 'mysql2/promise';

export class RoleController {

    static createRole = async (req, res, next) => {
        try {
            const { role_code, role_name } = req.body;

            // Validasi input
            if (!role_code || !role_name) {
                return res.status(400).json({
                    success: false,
                    message: 'Role code and name are required'
                });
            }

            // Cek duplikasi role_code
            const existingRole = await prisma.roles.findUnique({
                where: { role_code }
            });

            if (existingRole) {
                return res.status(400).json({
                    success: false,
                    message: 'Role code already exists'
                });
            }

            const role = await prisma.roles.create({
                data: {
                    role_code,
                    role_name
                }
            });

            return res.status(201).json(role);
        } catch (error) {
            next(error);
        }
    }

    static getAllRoles = async (req, res, next) => {
        try {
            const roles = await prisma.roles.findMany({});

            return res.status(200).json(roles);
        } catch (error) {
            next(error);
        }
    }

    static getRoleById = async (req, res, next) => {
        try {
            const { id } = req.params;

            const role = await prisma.roles.findUnique({
                where: { id: parseInt(id) },
            });

            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }

            return res.status(200).json(role);
        } catch (error) {
            next(error);
        }
    }

    static updateRole = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { role_code, role_name } = req.body;

            // Cek apakah role ada
            const role = await prisma.roles.findUnique({
                where: { id: parseInt(id) }
            });

            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }

            // Validasi role_code unik jika diubah
            if (role_code && role_code !== role.role_code) {
                const existingRole = await prisma.roles.findUnique({
                    where: { role_code }
                });

                if (existingRole) {
                    return res.status(400).json({
                        success: false,
                        message: 'Role code already exists'
                    });
                }
            }

            const updatedRole = await prisma.roles.update({
                where: { id: parseInt(id) },
                data: {
                    role_code: role_code || role.role_code,
                    role_name: role_name || role.role_name
                }
            });

            return res.status(200).json(updatedRole);
        } catch (error) {
            next(error);
        }
    }

    static deleteRole = async (req, res, next) => {
        try {
            const { id } = req.params;

            // Cek apakah role ada
            const role = await prisma.roles.findUnique({
                where: { id: parseInt(id) }
            });

            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }

            // Hapus role
            await prisma.roles.delete({
                where: { id: parseInt(id) }
            });

            return res.status(200).json({
                success: true,
                message: 'Role deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}