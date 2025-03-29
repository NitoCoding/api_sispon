import { prisma } from '../prisma.js';

export class KtiController {
    static getAllKti = async (req, res, next) => {
        try {
            // const tahun_ajaran = req..tahun_ajaran;
            // const semester = req.params.semester;
            const { tahun_ajaran, semester } = req.query;
            if(!tahun_ajaran || !semester) return res.status(400).json({
                success: false,
                message: 'Tahun ajaran and semester is required' 
            })
            // // const ktiData = await prisma.data_nilai_kti.findMany();
            // const ktiData = await prisma.data_nilai_kti.findMany({
            //     where: {
            //         id_tahun_ajaran: parseInt(tahun_ajaran),
            //         id_semester: parseInt(semester)
            //     }
            // });
            // const santri = await prisma.data_kti_view.findMany({
            //     where: {
            //         id_tahun_ajaran: parseInt(tahun_ajaran)
            //     },
            //     include: {
            //         data_rombel_anggota : true
            //     }
            // });
            // if (!ktiData) return res.status(404).json({ message: "KTI data not found" });
            const ktiData = await prisma.data_kti_view.findMany();
        
        // Group data by rombel
        const groupedData = ktiData.reduce((acc, curr) => {
            const rombelKey = `${curr.nama_rombel}-${curr.nama_tahun_ajaran}`;
            
            if (!acc[rombelKey]) {
                acc[rombelKey] = {
                    nama_rombel: curr.nama_rombel,
                    tahun_ajaran: curr.nama_tahun_ajaran,
                    santri: []
                };
            }
            
            // Add santri if not already in the array
            const santriExists = acc[rombelKey].santri.some(s => s.nama_santri === curr.nama_santri);
            if (!santriExists) {
                acc[rombelKey].santri.push({
                    nama_santri: curr.nama_santri,
                    kti_judul: curr.judul,
                    kti_nilai: curr.nilai
                });
            }
            
            return acc;
        }, {});

        // Convert to array format
        const formattedData = Object.values(groupedData);

        res.status(200).json({
            success: true,
            data: formattedData
        });
        } catch (error) {
            next(error);
        }
    };
    
    
    static getKtiById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const kti = await prisma.data_nilai_kti.findUnique({
                where: { id: parseInt(id) }
            });
            if (!kti) return res.status(404).json({ message: "KTI data not found" });
            res.status(200).json(kti);
        } catch (error) {
            next(error);
        }
    };

    // Create new KTI data
    static createKti = async (req, res, next) => {
        try {
            const {
                id_santri,
                id_tahun_ajaran,
                id_semester,
                nilai,
                judul
            } = req.body;

            const newKti = await prisma.data_nilai_kti.create({
                data: {
                    id_santri,
                    id_tahun_ajaran,
                    id_semester,
                    nilai,
                    judul
                }
            });
            res.status(201).json(newKti);
        } catch (error) {
            next(error);
        }
    };

    // Update KTI data by ID
    static updateKti = async (req, res, next) => {
        try {
            const { id } = req.params;
            const {
                id_santri,
                id_tahun_ajaran,
                id_semester,
                nilai,
                judul
            } = req.body;

            const updatedKti = await prisma.data_nilai_kti.update({
                where: { id: parseInt(id) },
                data: {
                    id_santri,
                    id_tahun_ajaran,
                    id_semester,
                    nilai,
                    judul
                }
            });
            res.status(200).json(updatedKti);
        } catch (error) {
            next(error);
        }
    };

    // Delete KTI data by ID
    static deleteKti = async (req, res, next) => {
        try {
            const { id } = req.params;
            await prisma.data_nilai_kti.delete({
                where: { id: parseInt(id) }
            });
            res.status(200).json({ message: "KTI data deleted successfully" });
        } catch (error) {
            next(error);
        }
    };

    // Batch create KTI data for multiple students
    static batchCreateKti = async (req, res, next) => {
        try {
            const { id_santri_array, id_tahun_ajaran, id_semester, nilai, judul } = req.body;

            if (!Array.isArray(id_santri_array) || id_santri_array.length === 0) {
                return res.status(400).json({ message: "Invalid or empty student ID array" });
            }

            const ktiData = await prisma.$transaction(
                id_santri_array.map(id_santri => {
                    return prisma.data_nilai_kti.create({
                        data: {
                            id_santri,
                            id_tahun_ajaran,
                            id_semester,
                            nilai,
                            judul
                        }
                    });
                })
            );

            res.status(201).json({
                message: "Batch KTI data creation successful",
                data: ktiData
            });
        } catch (error) {
            next(error);
        }
    };
}