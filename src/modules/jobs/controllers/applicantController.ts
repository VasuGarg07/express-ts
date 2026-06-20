import { NextFunction, Request, Response } from 'express';
import * as jobsService from '../services/applicantService';
import { AuthenticatedRequest } from '../../../types';

export const getJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, location } = req.query as Record<string, string>;
    const result = await jobsService.fetchJobs({ page, limit, search, location });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getJobDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await jobsService.fetchJobDetails(req.params.id as string);
    res.status(200).json({ job });
  } catch (error) {
    next(error);
  }
};

export const applyToJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await jobsService.applyForJob(res.locals.profileId, req.params.id as string, req.body.coverLetter);
    res.status(201).json({ message: 'Application submitted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMyApplications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const applications = await jobsService.fetchMyApplications(res.locals.profileId);
    res.status(200).json({ applications });
  } catch (error) {
    next(error);
  }
};

export const toggleSaveJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await jobsService.toggleSavedJob(res.locals.profileId, req.params.id as string);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getSavedJobs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const savedJobs = await jobsService.fetchSavedJobs(res.locals.profileId);
    res.status(200).json({ savedJobs });
  } catch (error) {
    next(error);
  }
};

export const getCompanies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search } = req.query as Record<string, string>;
    const result = await jobsService.fetchCompanies({ page, limit, search });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getCompanyDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await jobsService.fetchCompanyDetails(req.params.id as string);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};