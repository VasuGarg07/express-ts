import { NextFunction, Response } from 'express';
import * as profileService from './profileService';
import { AuthenticatedRequest } from '../../types';

export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await profileService.fetchProfile(res.locals.role, res.locals.profileId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const registerApplicant = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await profileService.registerNewApplicant(req.user?.id!, req.body);
    res.status(201).json({ message: 'Applicant registered successfully', profile });
  } catch (error) {
    next(error);
  }
};

export const registerEmployer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await profileService.registerNewEmployer(req.user?.id!, req.body);
    res.status(201).json({ message: 'Employer registered successfully', profile });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await profileService.editProfile(res.locals.role, res.locals.profileId, req.body);
    res.status(200).json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const message = await profileService.deleteUserAccount(
      res.locals.role,
      res.locals.profileId,
      req.params.id
    );
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};