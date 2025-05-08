import crypto from 'crypto';
import { config } from './config/index.js';
import { AppError } from './middleware/errorHandler.js';
import QRCode from 'qrcode';
import wkhtmltopdf from 'wkhtmltopdf';

const algorithm = 'aes-256-cbc';
const secret = config.secretKey;

if (!secret) {
    throw new Error('Encryption secret key is not configured');
}


const secretKey = crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32); // Ensure the key is 32 bytes
const ivLength = 16; // For AES, this is always 16

export const encrypt = (text) => {
    if (!text) {
        throw new AppError('Cannot encrypt undefined or empty value', 400);
    }
    try {
        const iv = crypto.randomBytes(ivLength);
        const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
        const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
        return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
    } catch (error) {
        throw new AppError('Encryption failed: ' + error.message, 500);
    }
};

export const decrypt = (encryptedText) => {
    if (!encryptedText) {
        throw new AppError('Cannot decrypt undefined or empty value', 400);
    }
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 2) {
            throw new AppError('Invalid encrypted text format', 400);
        }
        const [ivHex, encrypted] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedTextBuffer = Buffer.from(encrypted, 'hex');
        const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
        const decrypted = Buffer.concat([decipher.update(encryptedTextBuffer), decipher.final()]);
        return decrypted.toString('utf8');
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Decryption failed: ' + error.message, 500);
    }
};

const generateQRCode = async (imagePath) => {
    try {
        // Baca file gambar sebagai base64
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

        // Generate QR code dari data base64 gambar
        const qrDataURL = await QRCode.toDataURL(base64Image);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<img src="${qrDataURL}" alt="QR Code TTD" />`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating QR code');
    }
}

const htmlToPdf = async (templateReportName) => {

    const templatePath = path.join(__dirname, 'views', 'templateReportName.ejs');
    
    try {
        // Render HTML dari EJS template
        const html = await ejs.renderFile(templatePath, { users });

        // Set header untuk download sebagai PDF
        res.header('Content-Type', 'application/pdf');
        res.header('Content-Disposition', 'attachment; filename=Laporan_Pengguna.pdf');

        // Konversi HTML ke PDF menggunakan wkhtmltopdf
        wkhtmltopdf(html, {
            output: null, // Output sebagai stream
            pageSize: 'A4',
            orientation: 'Portrait',
            marginTop: '20mm',
            marginBottom: '20mm',
            marginLeft: '15mm',
            marginRight: '15mm',
        }).pipe(res);
    } catch (error) {
        
    }
}