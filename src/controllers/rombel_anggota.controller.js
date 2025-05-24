import { prisma } from '../prisma.js';
import {JWTService} from "../services/jwt.service.js";
import {getTokenPayload} from "../helpers.js";

export class RombelAnggotaController {
    static async createRombelAnggota(req, res, next) {
        try {

            const { id_rombel, id_santri } = req.body;
            const id_santri_list = Array.isArray(id_santri) ? id_santri : [id_santri];

            let count = 0;

            for (const id of id_santri_list) {
                const newAnggota = await prisma.data_rombel_anggota.create({
                    data: {
                        id_rombel: parseInt(id_rombel),
                        id_santri: parseInt(id),
                    },
                });
                count++;
            }

            res.status(201).json({"message": `${count} Siswa berhasil dimasukkan ke rombel`});
        } catch (error) {
            next(error);
        }
    }

    static async getRiwayatSantri(req, res, next) {
        try {
            const { id_santri } = req.params;

            const riwayat = await prisma.data_rombel_anggota.findMany({
                where: {
                    id_santri: parseInt(id_santri),
                },
                include: {
                    data_rombel: {
                        include: {
                            ref_kelas: true,
                            ref_tahun_ajaran: true,
                        },
                    },
                },
                orderBy: {
                    data_rombel: {
                        ref_kelas: {
                            id_tingkat: "desc"
                        }
                    }
                }
            });

            const mappedRiwayat = riwayat.map((item) => {
                const { data_rombel, ...rest } = item;
                return {
                    ...rest,
                    kelas: data_rombel.ref_kelas.kelas,
                    tahun_ajaran: data_rombel.ref_tahun_ajaran.nama,
                };
            });

            res.status(200).json(mappedRiwayat);
        } catch (error) {
            next(error);
        }
    }

    static async moveAnggota(req, res, next) {
        try {
            const { id_rombel_asal, id_santri, id_rombel_target } = req.body;
            const id_santri_list = Array.isArray(id_santri) ? id_santri : [id_santri];

            for (const id of id_santri_list) {
                const santri = await prisma.data_rombel_anggota.findFirst({
                    where: {
                        id_rombel: parseInt(id_rombel_asal),
                        id_santri: parseInt(id),
                    },
                });
                const updatedSantri = await prisma.data_rombel_anggota.update({
                    where: {
                        id: santri.id,
                    },
                    data: {
                        id_rombel: parseInt(id_rombel_target),
                    },
                })
            }


            res.status(200).json({"message": "Anggota moved successfully"});

        } catch (error) {
            next(error);
        }
    }

    static async syncRombel(req, res, next) {
        try {
            const { decoded, semester, tahunAjaran } = await getTokenPayload(req);

            const class_list = await prisma.ref_kelas.findMany();

            for (const class_item of class_list) {
                const rombel = await prisma.data_rombel.findMany({
                    where: {
                        id_tahun_ajaran: semester.id_tahun_ajaran,
                        id_kelas: class_item.id,
                    },
                });
                if (rombel.length === 0 || !rombel) {
                    const newRombel = await prisma.data_rombel.create({
                        data: {
                            id_kelas: class_item.id,
                            id_tahun_ajaran: semester.id_tahun_ajaran,
                            id_wali_kelas: null,
                            id_status: 13
                        },
                    });
                }
            }
            res.status(200).json({ message: "Rombel synced successfully" });;
        } catch (error) {
            next(error);
        }
    }
}
