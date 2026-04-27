import { NextFunction, Request, Response } from 'express';
import * as authService from './authService';
import { SUCCESS_STRINGS } from '../../utils/response.string';

export const createTestToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, username, email } = req.body;
    const data = authService.generateTestToken(id, username, email);
    res.status(200).json({ message: 'Token Generated', ...data });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, securityQuestion, securityAnswer } = req.body;
    const data = await authService.registerUser(username, email, password, securityQuestion, securityAnswer);
    res.status(201).json({ message: SUCCESS_STRINGS.UserCreated, ...data });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    const data = await authService.loginUser(username, password);
    res.status(200).json({ message: 'Login successful', ...data });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, securityAnswer, newPassword } = req.body;
    await authService.changeUserPassword(username, securityAnswer, newPassword);
    res.status(200).json({ message: SUCCESS_STRINGS.PasswordChanged });
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await authService.refreshTokens(req.body.refreshToken);
    res.status(200).json({ message: SUCCESS_STRINGS.TokenRefreshed, ...data });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.logoutUser(req.body.refreshToken);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};