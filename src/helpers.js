import crypto from 'crypto';
import { config } from './config/index.js';

const algorithm = 'aes-256-cbc';
const secret = config.secretKey;
const secretKey = crypto.createHash('sha256').update(secret).digest('base64').substr(0, 32); // Ensure the key is 32 bytes
const ivLength = 16; // For AES, this is always 16

export const encrypt = (text) => {
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decrypt = (encryptedText) => {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedTextBuffer = Buffer.from(encrypted, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedTextBuffer), decipher.final()]);
    return decrypted.toString();
};
