import winston from 'winston';
import { config } from './index.js';

const { combine, timestamp, printf, colorize } = winston.format;

const customFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

export const logger = winston.createLogger({
  level: config.logs.level,
  format: combine(
    timestamp(),
    colorize(),
    customFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ],
  // Prevent winston from exiting on error
  exitOnError: false
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  if(config.env === 'development'){
    console.error('Uncaught Exception:', error);
  }
  logger.error('Uncaught Exception:', { message: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  if(config.env === 'development'){
    console.error('Unhandled Rejection:', error);
  }
  logger.error('Unhandled Rejection:', { message: error.message, stack: error.stack });
  process.exit(1);
});