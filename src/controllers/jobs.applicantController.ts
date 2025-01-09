import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { Application } from '../models/jobscape/applicationModel';
import { Employer } from '../models/jobscape/employerModel';
import { Job } from '../models/jobscape/jobModel';
import { AuthenticatedRequest } from '../types';
import { ERROR_STRINGS, SUCCESS_STRINGS } from '../utils/response.string';

export const getAllJobs = async (req: Request, res: Response) => {
    const jobs = await Job.find(
        { isArchived: false }, // Filter out archived jobs
        { isArchived: 0 } // can show when this application will close
    )

    res.status(200).json({
        success: true,
        jobs,
        count: jobs.length,
    });
}

export const getJobBriefing = async (req: Request, res: Response) => {
    const { jobId } = req.params;

    if (!jobId || !ObjectId.isValid(jobId)) {
        res.status(400).json({
            success: false,
            error: "Invalid job ID",
        });
        return;
    }

    const job = await Job.findById(jobId, { isArchived: 0 });

    if (!job) {
        res.status(404).json({ error: ERROR_STRINGS.JobNotFound })
        return;
    }

    // Count applications for the given job
    const applicationCount = await Application.countDocuments({ jobId });

    res.status(200).json({ success: true, job, applicationCount });
}

export const getCompanyDetails = async (req: Request, res: Response) => {
    const { companyId } = req.params;

    if (!companyId || !ObjectId.isValid(companyId)) {
        res.status(400).json({
            success: false,
            error: "Invalid company ID",
        });
        return;
    }

    const company = await Employer.findById(companyId, { userId: 0 });

    if (!company) {
        res.status(404).json({ error: ERROR_STRINGS.CompanyNotFound })
        return;
    }

    res.status(200).json({ success: true, company });
}

export const applyJob = async (req: Request, res: Response) => {
    const { jobId, applicantId, coverLetter } = req.body;

    // Validate input
    if (!jobId || !applicantId) {
        res.status(400).json({ error: 'Job ID and Applicant ID are required.' });
        return;
    }

    // Check if the job exists
    const job = await Job.findById(jobId);
    if (!job) {
        res.status(404).json({ error: ERROR_STRINGS.JobNotFound });
        return;
    }

    // Check if the applicant has already applied for this job
    const existingApplication = await Application.findOne({ job: jobId, applicant: applicantId });
    if (existingApplication) {
        res.status(409).json({ error: 'You have already applied for this job.' });
        return;
    }

    // Create a new application
    const application = new Application({
        jobId,
        applicantId,
        status: 'pending', // Default status
        coverLetter
    });

    // Save the application
    await application.save();

    res.status(201).json({ message: SUCCESS_STRINGS.ApplicationSubmitted, application });
}

export const getAppliedJobs = async (req: AuthenticatedRequest, res: Response) => {
    const { profileId: applicantId } = req;

    // Find all applications for the given applicant
    const applications = await Application.find({ applicantId }).select('jobId');

    if (applications.length === 0) {
        res.status(200).json({ success: true, message: SUCCESS_STRINGS.NoApplications });
        return;
    }

    const jobIds = applications.map(app => app.jobId);
    const jobs = await Job.find({ _id: { $in: jobIds }, isArchived: false });

    if (jobs.length === 0) {
        res.status(404).json({ error: ERROR_STRINGS.NoJobsForApplications });
        return;
    }

    res.status(200).json({ jobs });
}

export const getApplicationStatus = async (req: Request, res: Response) => {
    const { applicationId } = req.params;

    if (!applicationId || !ObjectId.isValid(applicationId)) {
        res.status(400).json({
            success: false,
            error: "Invalid application ID",
        });
        return;
    }

    const application = await Application.findById(applicationId);

    if (!application) {
        res.status(404).json({ error: ERROR_STRINGS.ApplicationNotFound })
        return;
    }

    res.status(200).json({ success: true, status: application.status })
}