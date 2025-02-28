import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  dbUri: process.env.MONGODB_URI || 'mariadb://66.42.60.252:3306/new_siakad',
  jwtSecret: process.env.JWT_SECRET || '^!F1Z7477!78u3r*0P',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  // Add other configuration variables as needed
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  logs: {
    level: process.env.LOG_LEVEL || 'info'
  }
};