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

        const urlParts = req.baseUrl.split('/').filter(part => part.length > 0);
        let folderName = '';
        
        if (urlParts.includes('santri') || urlParts.includes('santris')) {
            folderName = 'foto_santri';
        } else if (urlParts.includes('guru') || urlParts.includes('pegawai')) {
            folderName = 'foto_guru_pegawai';
        } else {
            folderName = 'other'; // Default folder
        }
        const destPath = join(baseDir, folderName);
        
        // Ensure the directory exists
        if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
        }
        
        cb(null, destPath);
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
