import multer, { diskStorage } from 'multer';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamic storage configuration
const storage = diskStorage({
    destination: (req, file, cb) => {
        const baseDir = join(__dirname, '../../../images'); // Path to the `images` folder relative to this file

        let folder = baseDir; // Default folder
        if (req.baseUrl === '/santris') {
            folder = join(baseDir, 'foto_santri'); // Folder for Santri
        } else if (req.baseUrl === '/guru-pegawais') {
            folder = join(baseDir, 'foto_guru_pegawai'); // Folder for Guru/Pegawai
        }
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const santriName = JSON.parse(req.body.data).nama.toLowerCase().replace(" ", "-");
        cb(null, santriName + '-' + uniqueSuffix + extname(file.originalname));
    },
});

// Initialize multer middleware
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // File size limit: 5MB
});

export { upload };
