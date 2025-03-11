import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  dbUri: process.env.DATABASE_URL,
  dbUser: process.env.DATABASE_USER,
  dbPassword: process.env.DATABASE_PASSWORD,
  secretKey: process.env.SECRET_KEY,
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

