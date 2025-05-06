import { prisma } from '../prisma.js';
import {JWTService} from "../services/jwt.service.js";

export class KtiController {
    static getAllKti = async (req, res, next) => {
        try {
            const { groupbyclass, class: className } = req.query;
            const token = req.headers.authorization?.split(" ")[1];
            console.log(token);

            if (!token) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const decoded = JWTService.decodeToken(token);
            const semester = await prisma.ref_semester.findFirst({
                where: { id: parseInt(decoded.semester) },
            });
            if (!semester) {
                return res.status(400).json({ message: "Invalid token: Missing semester" });
            }

            const tahunAjaran = await prisma.ref_tahun_ajaran.findFirst({
                where: { id: semester.id_tahun_ajaran },
            });
            if (!tahunAjaran) {
                return res.status(404).json({ message: "Academic year not found" });
            }

            const whereClause = { id_tahun_ajaran: tahunAjaran.id };
            if (className) {
                whereClause["nama"] = className;
            }

            // Ambil data rombel beserta anggota-anggotanya
            const rombels = await prisma.data_rombel.findMany({
                where: whereClause,
                include: {
                    data_rombel_anggota: true,
                },
            });

            let santriData = [];
            let allAnggotaIds = new Set();

            // Kumpulkan id santri dari rombel
            for (const rombel of rombels) {
                const anggotaIds = rombel.data_rombel_anggota.map((anggota) => anggota.id_santri);
                anggotaIds.forEach((id) => allAnggotaIds.add(id));

                const santriList = await prisma.santri.findMany({
                    where: { id: { in: anggotaIds } },
                    select: { id: true, nis: true, nama: true },
                });

                const ktiList = await prisma.data_nilai_kti.findMany({
                    where: { id_santri: { in: anggotaIds }, id_tahun_ajaran: tahunAjaran.id },
                    select: { id: true, id_santri: true, judul: true, nilai: true },
                });

                const ktiMap = ktiList.reduce((acc, kti) => {
                    acc[kti.id_santri] = kti;
                    return acc;
                }, {});

                const simplifiedStudents = santriList.map((santri) => {
                    const kti = ktiMap[santri.id] || {};
                    return {
                        id: kti.id || null,
                        nim: santri.nis,
                        nama: santri.nama,
                        kelas: rombel.nama,
                        judul: kti.judul || null,
                        nilai: kti.nilai || null,
                    };
                });

                santriData.push({
                    class_id: rombel.id,
                    class: rombel.nama,
                    students: simplifiedStudents,
                });
            }

            // Penyusunan response akhir
            if (groupbyclass === "true") {
                const sortedData = santriData.map((rombel) => {
                    rombel.students.sort((a, b) => a.nama.localeCompare(b.nama));
                    return rombel;
                });
                return res.status(200).json(sortedData);
            } else {
                const flatList = santriData
                    .flatMap((item) => item.students)
                    .sort((a, b) => a.nama.localeCompare(b.nama));
                return res.status(200).json(flatList);
            }
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

    // Batch create KTI data for multiple students
    static batchCreateKti = async (req, res, next) => {
        try {
            // Destructure input dari req.body
            const { id_santri, id_tahun_ajaran, id_semester, nilai, judul } = req.body;

            // Validasi input
            if (!id_santri || !id_tahun_ajaran || !id_semester || !nilai || !judul) {
                return res.status(400).json({
                    message: "Missing required fields: id_santri, id_tahun_ajaran, id_semester, nilai, judul"
                });
            }

            // Konversi id_santri menjadi array jika bukan array
            const id_santri_list = Array.isArray(id_santri) ? id_santri : [id_santri];

            // Validasi bahwa id_santri_list tidak kosong
            if (id_santri_list.length === 0) {
                return res.status(400).json({
                    message: "id_santri list cannot be empty"
                });
            }

            // Buat array data untuk transaksi batch
            const ktiData = await prisma.$transaction(
                id_santri_list.map(id_santri => {
                    return prisma.data_nilai_kti.create({
                        data: {
                            id_santri: parseInt(id_santri), // Pastikan id_santri adalah integer
                            id_tahun_ajaran: parseInt(id_tahun_ajaran), // Pastikan integer
                            id_semester: parseInt(id_semester), // Pastikan integer
                            nilai: parseFloat(nilai), // Konversi nilai ke float
                            judul
                        }
                    });
                })
            );

            // Kirim respons sukses
            res.status(201).json({
                message: "KTI data creation successful",
                data: ktiData
            });
        } catch (error) {
            // Tangani error dengan middleware
            next(error);
        }
    };

    // Update KTI data by ID
    static updateKti = async (req, res, next) => {
        try {
            // Ambil token dari header Authorization
            const token = req.headers.authorization?.split(" ")[1];
            if (!token) {
                return res.status(401).json({ message: "Unauthorized: No token provided" });
            }

            // Dekode token untuk mendapatkan semester
            const decoded = JWTService.decodeToken(token);
            console.log("Decoded token:", decoded);
            if (!decoded.semester) {
                return res.status(400).json({ message: "Invalid token: Missing semester" });
            }

            // Ambil data semester
            const semester = await prisma.ref_semester.findFirst({
                where: { id: parseInt(decoded.semester) }
            });
            if (!semester) {
                return res.status(400).json({ message: "Invalid semester in token" });
            }

            // Ambil tahun ajaran terkait
            const tahunAjaran = await prisma.ref_tahun_ajaran.findFirst({
                where: { id: semester.id_tahun_ajaran }
            });
            if (!tahunAjaran) {
                return res.status(404).json({ message: "Academic year not found" });
            }

            // Logging untuk debugging
            console.log("Semester:", semester);
            console.log("Tahun Ajaran:", tahunAjaran);

            // Ambil input dari req.body
            const { id_santri, nilai, judul } = req.body;

            // Validasi input
            if (!id_santri) {
                return res.status(400).json({ message: "id_santri is required" });
            }

            // Konversi id_santri menjadi array jika bukan array
            const id_santri_list = Array.isArray(id_santri) ? id_santri : [id_santri];

            // Validasi bahwa id_santri_list tidak kosong
            if (id_santri_list.length === 0) {
                return res.status(400).json({ message: "id_santri list cannot be empty" });
            }

            // Logging input
            console.log("Received input:", { id_santri, nilai, judul });
            console.log("id_santri_list:", id_santri_list);

            // Siapkan data untuk update atau create
            const updateData = {};
            const createData = {
                id_tahun_ajaran: tahunAjaran.id,
                id_semester: semester.id
            };
            if (judul) {
                updateData.judul = judul;
                createData.judul = judul;
            }
            if (nilai) {
                updateData.nilai = parseFloat(nilai);
                createData.nilai = parseFloat(nilai);
            }

            // Proses setiap santri secara berurutan
            const updatedData = [];
            for (const santriId of id_santri_list) {
                // Cari entri KTI yang ada
                createData.id_santri = parseInt(santriId);
                const existingKti = await prisma.data_nilai_kti.findFirst({
                    where: {
                        id_santri: parseInt(santriId),
                        id_tahun_ajaran: tahunAjaran.id,
                        id_semester: semester.id
                    }
                });

                let kti;
                if (existingKti) {
                    // Jika entri ada, update hanya field yang dikirim
                    if (Object.keys(updateData).length > 0) {
                        kti = await prisma.data_nilai_kti.update({
                            where: { id: existingKti.id },
                            data: updateData
                        });
                    } else {
                        kti = existingKti; // Tidak ada perubahan, kembalikan data asli
                    }
                } else {
                    // Jika entri tidak ada, buat baru
                    kti = await prisma.data_nilai_kti.create({
                        data: createData
                    });
                }
                updatedData.push(kti);
            }

            // Kirim respons sukses
            res.status(200).json({
                message: `Successfully processed ${updatedData.length} KTI data`,
                data: updatedData
            });
        } catch (error) {
            console.error("Error processing KTI:", error);
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
}