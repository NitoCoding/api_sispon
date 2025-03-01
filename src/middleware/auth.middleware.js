import { JWTService } from '../services/jwt.service.js';
import { AppError } from './errorHandler.js';

export const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
    const token = JWTService.extractTokenFromHeader(req);

    // Verify token
    const decoded = JWTService.verifyToken(token);

    // Add user data to request object
    req.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
};

// Optional: Role-based authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Not authorized to access this route', 403));
    }

    next();
  };
};