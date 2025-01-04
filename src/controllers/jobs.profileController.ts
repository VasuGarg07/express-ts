import { NextFunction, Response } from 'express';
import { Applicant } from '../models/jobscape/applicantModel';
import { Application } from '../models/jobscape/applicationModel';
import { Employer } from '../models/jobscape/employerModel';
import { Job } from '../models/jobscape/jobModel';
import { SavedJob } from '../models/jobscape/savedJobs';
import { AuthenticatedRequest } from '../types';
import { JobRoles } from '../utils/constants';
import { ERROR_STRINGS, SUCCESS_STRINGS } from '../utils/response.string';

export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    // Check if user is an applicant
    const applicantProfile = await Applicant.findOne({ userId });
    if (applicantProfile) {
        res.setHeader("Role", JobRoles.applicant);
        res.status(200).json({ profile: applicantProfile, message: "Success", role: JobRoles.applicant });
        return;
    }

    // Check if user is an employer
    const employerProfile = await Employer.findOne({ userId });
    if (employerProfile) {
        res.setHeader("Role", JobRoles.employer);
        res.status(200).json({ profile: employerProfile, message: "Success", role: JobRoles.employer });
        return;
    }

    // If neither, return not found
    res.status(400).json({ error: ERROR_STRINGS.ProfileNotFound });
}

export const registerApplicant = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    // Check if applicant already exists
    const existingApplicant = await Applicant.findOne({ userId });
    if (existingApplicant) {
        res.status(400).json({ error: ERROR_STRINGS.ApplicantExists });
        return;
    }

    // Create new applicant
    const newApplicant = new Applicant({ userId, ...req.body });
    const savedApplicant = await newApplicant.save();
    res.status(201).json({
        message: SUCCESS_STRINGS.ApplicantRegistered,
        applicant: savedApplicant
    });
}

export const registerEmployer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    // Check if employer already exists
    const existingEmployer = await Employer.findOne({ userId });
    if (existingEmployer) {
        res.status(400).json({ error: ERROR_STRINGS.EmployerExists });
        return;
    }

    // Create new employer
    const newEmployer = new Employer({ userId, ...req.body });
    const savedEmployer = await newEmployer.save();
    res.status(201).json({
        message: SUCCESS_STRINGS.EmployerRegistered,
        employer: savedEmployer
    });
}

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const role = req.headers["role"] as string;

    if (role === JobRoles.applicant) {
        // Update applicant profile
        const updatedApplicant = await Applicant.findOneAndUpdate(
            { userId },
            req.body,
            { new: true } // Return the updated document
        );

        if (!updatedApplicant) {
            res.status(404).json({ error: ERROR_STRINGS.ProfileNotFound });
            return;
        }

        res.status(200).json({
            message: SUCCESS_STRINGS.ProfileUpdated,
            profile: updatedApplicant
        });
        return;
    }

    if (role === JobRoles.employer) {
        // Update employer profile
        const updatedEmployer = await Employer.findOneAndUpdate(
            { userId },
            req.body,
            { new: true } // Return the updated document
        );

        if (!updatedEmployer) {
            res.status(404).json({ error: ERROR_STRINGS.ProfileNotFound });
            return;
        }

        res.status(200).json({
            message: SUCCESS_STRINGS.ProfileUpdated,
            profile: updatedEmployer
        });
        return;
    }
}

export const deleteAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { accountId } = req.params; // Extract accountId from the URL
    const role = req.headers["role"] as string; // Extract role from headers

    if (!role) {
        res.status(400).json({ error: ERROR_STRINGS.RoleNotFound });
        return;
    }

    if (!accountId) {
        res.status(400).json({ error: "Account ID is required." });
        return;
    }

    if (role === JobRoles.applicant) {
        // Delete applicant profile
        const deletedApplicant = await Applicant.findByIdAndDelete(accountId);
        if (!deletedApplicant) {
            res.status(404).json({ error: ERROR_STRINGS.ProfileNotFound });
            return;
        }

        // Delete associated data
        await SavedJob.deleteMany({ applicantId: accountId });
        await Application.deleteMany({ applicantId: accountId });

        res.status(200).json({
            message: SUCCESS_STRINGS.ApplicantDeleted,
            account: deletedApplicant,
        });
        return;
    }

    if (role === JobRoles.employer) {
        // Delete employer profile
        const deletedEmployer = await Employer.findByIdAndDelete(accountId);
        if (!deletedEmployer) {
            res.status(404).json({ error: ERROR_STRINGS.ProfileNotFound });
            return;
        }

        // Find jobs posted by the employer
        const employerJobs = await Job.find({ postedBy: accountId });
        const jobIds = employerJobs.map(job => job._id);

        // Delete jobs and their associated applications
        await Job.deleteMany({ postedBy: accountId });
        await Application.deleteMany({ jobId: { $in: jobIds } });

        res.status(200).json({
            message: SUCCESS_STRINGS.EmployerDeleted,
            account: deletedEmployer,
        });
        return;
    }
}