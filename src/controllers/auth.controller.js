import { AppError } from '../middleware/errorHandler.js';
import { JWTService } from '../services/jwt.service.js';

export const login = async (req, res, next) => {
  try {
    const { name, password } = req.body;
    // TODO: Add user validation and password verification here
    // For demo purposes, we'll create a mock user
    const user = {
      id: 1,
      name: name,
      role: 'user'
    };

    // Generate tokens
    const { accessToken, refreshToken } = JWTService.generateTokens(user);

    res.status(200).json({
      status: 'success',
      data: {
        user,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // TODO: Add user creation logic here
    // For demo purposes, we'll create a mock user
    const user = {
      id: 1,
      name,
      email,
      role: 'user'
    };

    // Generate tokens
    const { accessToken, refreshToken } = JWTService.generateTokens(user);

    res.status(201).json({
      status: 'success',
      data: {
        user,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    // TODO: Add token blacklisting logic here
    res.status(200).json({
      status: 'success',
      message: 'Successfully logged out'
    });
  } catch (error) {
    next(error);
  }
};