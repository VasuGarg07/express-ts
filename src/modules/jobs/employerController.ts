import { NextFunction, Response } from 'express';
import * as employerJobsService from './employerService';
import { AuthenticatedRequest } from '../../types';

export const getMyJobs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await employerJobsService.fetchMyJobs(res.locals.profileId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const createJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const job = await employerJobsService.createJob(res.locals.profileId, req.body);
    res.status(201).json({ message: 'Job created successfully', job });
  } catch (error) {
    next(error);
  }
};

export const getJobWithApplications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const job = await employerJobsService.fetchJobWithApplications(res.locals.profileId, req.params.id as string);
    res.status(200).json({ job });
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const job = await employerJobsService.editJob(res.locals.profileId, req.params.id as string, req.body);
    res.status(200).json({ message: 'Job updated successfully', job });
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await employerJobsService.removeJob(res.locals.profileId, req.params.id as string);
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const toggleArchiveJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { isArchived, status } = await employerJobsService.toggleArchive(res.locals.profileId, req.params.id as string);
    res.status(200).json({ message: `Job ${status} successfully`, isArchived });
  } catch (error) {
    next(error);
  }
};