import { prisma } from '../prisma.js';
import {getTokenPayload} from "../helpers.js";

export class RombelKelasController {

    static async createRombelKelas(req, res, next) {
        try {

        } catch (error) {
            next(error);
        }
    }

    static async getAllRombelKelas(req, res, next) {
        try {
            const { decoded, semester, tahunAjaran, user } = await getTokenPayload(req);

            if (!user.kode_pegawai || isNaN(parseInt(user.kode_pegawai))) {
                throw new Error('Kode pegawai tidak valid');
            }

            const guru = await prisma.guru_pegawai.findFirst({
                where: {
                    id: parseInt(user.kode_pegawai),
                },
            });

            const rombelWhereClause = {
                id_tahun_ajaran: semester.id_tahun_ajaran,
            };
            const mapelWhereClause = {};

            if (user.role_id === 19) {
                rombelWhereClause.id_wali_kelas = guru.id;
            } else if (user.role_id === 21) {
                mapelWhereClause.id_pengajar = guru.id
            }

            const rombel = await prisma.data_rombel.findMany({
                where: rombelWhereClause,
                include: {
                    ref_kelas: true,
                    guru_pegawai: true,
                    data_kelas: {
                        include: {
                            ref_mapel: {
                                include: {
                                    guru_pegawai: {
                                        select: {
                                            id: true,
                                            nama_gp: true,
                                        },
                                    },
                                },
                                where: mapelWhereClause,
                            },
                            data_rencana_penilaian: {
                                include: {
                                    ref_komponen_nilai: true,
                                },
                            },
                        },
                    },
                },
            });

            const mappedRombel = rombel.map((rombels) => {
                const { nama, ref_kelas, guru_pegawai, data_kelas, ...rest } = rombels;
                const wali_kelas = guru_pegawai ? guru_pegawai.nama_gp : '-';
                const list_mapel = data_kelas ? data_kelas.map((kelas) => ({
                    id_kelas: kelas.id,
                    id_mapel: kelas.ref_mapel.id,
                    id_guru: kelas.ref_mapel.guru_pegawai.id,
                    nama: kelas.ref_mapel.nama,
                    guru: kelas.ref_mapel.guru_pegawai.nama_gp,
                    daftar_penilaian: kelas.data_rencana_penilaian.map((penilaian) => ({
                        id: penilaian.ref_komponen_nilai.id,
                        nama: penilaian.ref_komponen_nilai.nama,
                    })),
                })) : [];

                return {
                    ...rest,
                    kelas: ref_kelas ? ref_kelas.kelas : '-',
                    wali_kelas,
                    list_mapel,
                };
            });

            res.status(200).json(mappedRombel);
        } catch (error) {
            next(error);
        }
    }

}