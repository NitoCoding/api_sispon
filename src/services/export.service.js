// services/report.service.js

import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import wkhtmltopdf from 'wkhtmltopdf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Render EJS template ke HTML string
 */
export const renderEjsTemplate = async (templateFileName, data = {}) => {
    const templatePath = path.join(__dirname, '..', '..', 'views', templateFileName);
    return await ejs.renderFile(templatePath, data);
};

/**
 * Konversi HTML ke PDF dan langsung kirim ke response stream
 */
export const convertHtmlToPdf = (res, html) => {
    res.header('Content-Type', 'application/pdf');
    res.header('Content-Disposition', 'attachment; filename=Laporan_Pengguna.pdf');

    wkhtmltopdf(html, {
        output: null,
        pageSize: 'A4',
        orientation: 'Portrait',
        marginTop: '20mm',
        marginBottom: '20mm',
        marginLeft: '15mm',
        marginRight: '15mm'
    }).pipe(res);
};

export const generateQRCode = async (res,imagePath) => {
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

export const printPdf = async (res, data, templatePath, orientation = 'Portrait', filename = 'document.pdf') => {
    try {
        // Render EJS template with provided data
        const html = await ejs.renderFile(templatePath, { data });

        // Set response headers for PDF
        res.header('Content-Type', 'application/pdf');
        res.header('Content-Disposition', `attachment; filename=${filename}`);

        // Configure wkhtmltopdf options
        const pdfOptions = {
            output: null, // Stream output
            pageSize: 'Folio',
            orientation: orientation,
            marginTop: '10mm',
            marginBottom: '20mm',
            marginLeft: '15mm',
            marginRight: '15mm',
        };

        // Generate and stream PDF
        wkhtmltopdf(html, pdfOptions).pipe(res);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send(`Error generating PDF: ${error.message}`);
    }
};