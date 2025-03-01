import * as jose from 'jose';
import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';

export class JWTService {
  static async generateTokens(payload) {
    const secret = new TextEncoder().encode(config.jwtSecret);
    
    const accessToken = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpiresIn(config.jwtExpiresIn)
      .sign(secret);

    const refreshToken = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpiresIn('7d')
      .sign(secret);

    return { accessToken, refreshToken };
  }

  static async verifyToken(token) {
    try {
      const secret = new TextEncoder().encode(config.jwtSecret);
      const { payload } = await jose.jwtVerify(token, secret);
      return payload;
    } catch (error) {
      if (error.code === 'ERR_JWT_EXPIRED') {
        throw new AppError('Token has expired', 401);
      }
      throw new AppError('Invalid token', 401);
    }
  }

  static extractTokenFromHeader(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }
    return authHeader.split(' ')[1];
  }
}