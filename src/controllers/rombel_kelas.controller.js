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
            const { decoded, semester, tahunAjaran } = await getTokenPayload(req);

            const rombel = await prisma.data_rombel.findMany({
                where: {
                    id_tahun_ajaran: semester.id_tahun_ajaran,
                },
                include: {
                    ref_kelas:true,
                    guru_pegawai:true,
                    data_kelas:true,
                }
            });

            console.log(rombel);

            const mappedRombel = rombel.map((rombels) => {
                const { nama, ref_kelas, guru_pegawai,  ...rest } = rombels;
                const wali_kelas = guru_pegawai ? guru_pegawai.nama_gp : "-";
                return {
                    ...rest,
                    kelas: ref_kelas.kelas,
                    wali_kelas,
                };
            });

            res.status(200).json(mappedRombel);

        } catch (error) {
            next(error);
        }
    }

}