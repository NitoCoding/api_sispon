import { AppError } from "../middleware/errorHandler";
import { prisma } from "../prisma.js";

export class PencapaianController {
//     static getAllPencapaian = async (req, res, next) => {
//         try {
//             const { tahun_ajaran, semester, pencapaian } = req.query;
//             if(!tahun_ajaran ||!semester) return res.status(400).json({
//                 success: false,
//                 message: 'Tahun ajaran and semester is required'  
//             })

//         }catch(error) {
//             next(new AppError(error.message, 500));
//         }
//     }

//     static getPencapaianByIdSantri = async (req, res, next) => {
//         try {
//             const { nis } = req.params;
//             const { tahun_ajaran, semester } = req.query; 
//             if(!tahun_ajaran ||!semester) return res.status(400).json({
//                 success: false,
//                 message: 'Tahun ajaran and semester is required' 
//             })
            
//             const pencapaian = await prisma.data_pencapaian.findMany({
//                 where: {
//                     id_tahun_ajaran: parseInt(tahun_ajaran),
//                     id_semester: parseInt(semester),
//                     id_santri: parseInt(nis)
//                 }
//             });
//         }catch(error) {
//             next(new AppError(error.message, 500));
//         }
//     }

}