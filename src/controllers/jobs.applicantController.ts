import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { Employer } from '../models/jobscape/employerModel';
import { Job } from '../models/jobscape/jobModel';
import { AuthenticatedRequest } from '../types';
import { ERROR_STRINGS, SUCCESS_STRINGS } from '../utils/response.string';
import { SavedJob } from '../models/jobscape/savedJobs';
import { Applicant, IPreference } from '../models/jobscape/applicantModel';
import { Application } from '../models/jobscape/applicationModel';

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

export const applyJob = async (req: AuthenticatedRequest, res: Response) => {
    const applicantId = req.profileId;
    const { jobId, coverLetter } = req.body;

    // Validate input
    if (!jobId) {
        res.status(400).json({ error: 'Job ID are required.' });
        return;
    }

    // Check if the job exists
    const job = await Job.findById(jobId);
    if (!job) {
        res.status(404).json({ error: ERROR_STRINGS.JobNotFound });
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

    res.status(200).json({ jobs, count: jobs.length });
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

export const saveJob = async (req: AuthenticatedRequest, res: Response) => {
    const applicantId = req.profileId;
    const { jobId } = req.body;

    // Validate input
    if (!jobId) {
        res.status(400).json({ error: 'Job ID is required.' });
        return;
    }

    // Check if the job exists
    const job = await Job.findById(jobId, { isArchived: 0 });
    if (!job) {
        res.status(404).json({ error: ERROR_STRINGS.JobNotFound });
        return;
    }

    // Check if the job is already saved
    const existingSavedJob = await SavedJob.findOne({ jobId, applicantId });
    if (existingSavedJob) {
        res.status(409).json({ error: ERROR_STRINGS.JobAlreadySaved });
        return;
    }

    // Save the job
    const savedJob = new SavedJob({ jobId, applicantId });
    await savedJob.save();

    res.status(201).json({ message: SUCCESS_STRINGS.JobSaved });
}

export const getSavedJobs = async (req: AuthenticatedRequest, res: Response) => {
    const { profileId: applicantId } = req;

    const savedJobs = await SavedJob.find({ applicantId }).select('jobId');

    if (savedJobs.length === 0) {
        res.status(200).json({ success: true, message: "No Jobs Saved" });
        return;
    }

    const jobIds = savedJobs.map(app => app.jobId);
    const jobs = await Job.find({ _id: { $in: jobIds }, isArchived: false });

    res.status(200).json({ jobs, count: jobs.length });
}

export const deleteSavedJob = async (req: Request, res: Response) => {
    const { jobId } = req.params;
    if (!jobId || !ObjectId.isValid(jobId)) {
        res.status(400).json({
            success: false,
            error: "Invalid job ID",
        });
        return;
    }

    const deleteSaved = await SavedJob.findById(jobId);

    if (!deleteSaved) {
        res.status(404).json({
            success: false,
            error: ERROR_STRINGS.JobNotFound,
        });
        return;
    }

    res.status(200).json({
        success: true,
        message: SUCCESS_STRINGS.JobDeleted
    });
}

export const updateApplicantPreference = async (req: AuthenticatedRequest, res: Response) => {
    const applicantId = req.profileId;
    const preferenceData = req.body;

    // Check if the applicant exists
    const applicant = await Applicant.findById(applicantId);
    if (!applicant) {
        res.status(404).json({ error: ERROR_STRINGS.NoApplicant });
        return;
    }

    // Update the applicant's preference
    applicant.preference = preferenceData;
    await applicant.save();

    res.status(200).json({ message: 'Preferences updated successfully.', applicant });
};

export const getRecommendedJobs = async (req: AuthenticatedRequest, res: Response) => {
    const applicantId = req.profileId;

    // Fetch applicant and their preferences
    const applicant = await Applicant.findById(applicantId);
    if (!applicant) {
        res.status(404).json({ error: ERROR_STRINGS.NoApplicant });
        return;
    }

    const preference: IPreference = applicant.preference;

    // Fetch all active jobs (not archived)
    const allJobs = await Job.find({ isArchived: false });

    // Calculate match score for each job
    const scoredJobs = allJobs.map(job => {
        let score = 0;

        // Salary Range Match (40%)
        const jobSalary = parseInt(job.salaryRange.split('-')[0]); // Assuming salaryRange is '50000-70000'
        if (jobSalary >= preference.expectedSalary) score += 45;
        // Job Type Match (20%)
        if (job.employmentType === preference.jobType) score += 20;
        // Location Match (10%)
        if (preference.locations.includes(job.location)) score += 10;
        // Shift Match (20%)
        if (preference.shift && job.shiftType === preference.shift) score += 20;
        // Role Match (10%)
        if (preference.role && preference.role.some(role => job.title.toLowerCase().includes(role.toLowerCase()))) {
            score += 10;
        }

        return { job, score };
    });

    const recommendedJobs = scoredJobs
        .filter(item => item.score >= 30)
        .sort((a, b) => b.score - a.score)
        .map(item => ({
            ...item.job.toObject(),  // Convert Mongoose document to plain object
            matchScore: item.score   // Include the match score
        }));


    if (recommendedJobs.length === 0) {
        res.status(404).json({ message: 'No recommended jobs found.' });
        return;
    }

    res.status(200).json({ jobs: recommendedJobs, count: recommendedJobs.length });
}

export const getApplicantDashboardAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    const applicantId = req.profileId;

    // 1. Total Applications
    const totalApplications = await Application.countDocuments({ applicantId });

    // 2. Application Status Breakdown
    const statusBreakdown = await Application.aggregate([
        { $match: { applicantId } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // 3. Total Saved Jobs
    const totalSavedJobs = await SavedJob.countDocuments({ applicantId });

    // 4. Recent Applications (Last 5)
    const recentApplications = await Application.find({ applicantId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("jobId", "title location salaryRange employmentType");

    // Format the response
    res.status(200).json({
        totalApplications,
        statusBreakdown,
        totalSavedJobs,
        recentApplications
    });
};
