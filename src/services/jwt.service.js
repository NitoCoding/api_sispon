import * as jose from 'jose';
import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';

export class JWTService {
  static async generateToken(payload, expiresIn = '7d', secret = config.jwtSecret ) {
    const secretKey = new TextEncoder().encode(secret);

    // return { accessToken, refreshToken };

    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(expiresIn)
      .sign(secretKey);

    return jwt;
  }

  static async verifyToken(token, secret = config.jwtSecret) {
    try {
      const secretJWT = new TextEncoder().encode(secret);
      const { payload } = await jose.jwtVerify(token, secretJWT);
      return payload;
    } catch (error) {
      if (error.code === 'ERR_JWT_EXPIRED') {
        throw new AppError('Token has expired', 401, error.payload);
      }
      throw new AppError('Invalid token', 401);
    }
  }

  static decodeToken(token) {
    try {
      const secret = new TextEncoder().encode(config.jwtSecret);
      return jose.decodeJwt(token);
    } catch (err) {
      return null;
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