import { AppError } from '../middleware/errorHandler.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // TODO: Implement login logic
    throw new AppError('Not implemented yet', 501);
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    // TODO: Implement registration logic
    throw new AppError('Not implemented yet', 501);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    // TODO: Implement logout logic
    throw new AppError('Not implemented yet', 501);
  } catch (error) {
    next(error);
  }
};