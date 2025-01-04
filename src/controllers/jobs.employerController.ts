import { Response } from 'express';
import { ObjectId } from 'mongodb';
import { Application } from '../models/jobscape/applicationModel';
import { Job } from '../models/jobscape/jobModel';
import { AuthenticatedRequest } from '../types';
import { ERROR_STRINGS, SUCCESS_STRINGS } from '../utils/response.string';

const getJobSummary = async (employerId: string) => {
    const [summary] = await Job.aggregate([
        { $match: { postedBy: new ObjectId(employerId) } },
        {
            $group: {
                _id: null,
                totalJobs: { $sum: 1 },
                activeJobs: { $sum: { $cond: [{ $eq: ["$isArchived", false] }, 1, 0] } },
                archivedJobs: { $sum: { $cond: [{ $eq: ["$isArchived", true] }, 1, 0] } }
            }
        }
    ]);

    return summary || { totalJobs: 0, activeJobs: 0, archivedJobs: 0 };
};

const getApplicationStatusBreakdown = async (employerId: string) => {
    const stats = await Application.aggregate([
        {
            $lookup: {
                from: "jobs",
                localField: "jobId",
                foreignField: "_id",
                as: "jobDetails"
            }
        },
        { $unwind: "$jobDetails" },
        { $match: { "jobDetails.postedBy": new ObjectId(employerId) } },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 }
            }
        }
    ]);

    return stats || [];
};

const getJobPerformance = async (employerId: string) => {
    const jobs = await Application.aggregate([
        {
            $lookup: {
                from: "jobs",
                localField: "jobId",
                foreignField: "_id",
                as: "jobDetails"
            }
        },
        { $unwind: "$jobDetails" },
        { $match: { "jobDetails.postedBy": new ObjectId(employerId) } },
        {
            $group: {
                _id: "$jobId",
                applications: { $sum: 1 },
                jobDetails: { $first: "$jobDetails" }
            }
        },
        {
            $project: {
                jobId: "$_id",
                title: "$jobDetails.title",
                applicationDeadline: "$jobDetails.applicationDeadline",
                applications: 1
            }
        },
        { $sort: { applications: 1 } } // Sort ascending for least and most
    ]);

    return {
        leastApplicantJob: jobs[0] || null,
        mostApplicantJob: jobs.length > 1 ? jobs[jobs.length - 1] : null
    };
};


export const getDashboardAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    const { profileId } = req;

    if (!profileId) {
        res.status(400).json({ message: ERROR_STRINGS.ProfileNotFound });
        return;
    }

    // Fetch analytics
    const [jobSummary, applicationStats, jobPerformance] = await Promise.all([
        getJobSummary(profileId),
        getApplicationStatusBreakdown(profileId),
        getJobPerformance(profileId)
    ]);

    // Construct response
    res.status(200).json({
        success: true,
        data: {
            jobSummary,
            applicationStats,
            jobPerformance
        }
    });
};

export const getAllJobsByEmployer = async (req: AuthenticatedRequest, res: Response) => {
    const { profileId } = req;

    // Fetch all jobs posted by the employer
    const jobs = await Job.find({ postedBy: profileId })
        .sort({ createdAt: -1 }) // Sort by most recently created jobs
        .exec();

    res.status(200).json({
        success: true,
        count: jobs.length,
        jobs,
    });
};


export const postJob = async (req: AuthenticatedRequest, res: Response) => {
    const { profileId } = req;

    const {
        title,
        location,
        skillsRequired,
        experienceRequired,
        salaryRange,
        employmentType,
        shiftType,
        description,
        responsibilities,
        requirements,
        benefits,
        applicationDeadline,
    } = req.body;


    const newJob = new Job({
        postedBy: profileId,
        title,
        location,
        skillsRequired,
        experienceRequired,
        salaryRange,
        employmentType,
        shiftType,
        description,
        responsibilities,
        requirements,
        benefits,
        applicationDeadline,
    });

    await newJob.save();
    res.status(201).json({ success: true, message: SUCCESS_STRINGS.JobPosted, job: newJob });
};

export const getJobDetails = async (req: AuthenticatedRequest, res: Response) => {
    const { jobId } = req.params;
    const { profileId } = req;

    const job = await Job.findById(jobId);

    if (!job) {
        res.status(404).json({
            success: false,
            error: ERROR_STRINGS.JobNotFound
        })
        return;
    }

    if (job.postedBy.toString() !== profileId) {
        res.status(403).json({
            success: false,
            error: ERROR_STRINGS.JobNotOwned,
        });
        return;
    }

    // Count applications for the given job
    const applicationCount = await Application.countDocuments({ jobId });

    res.status(200).json({ success: true, job, applicationCount });
};

export const updateJob = async (req: AuthenticatedRequest, res: Response) => {
    const { jobId } = req.params;

    if (!jobId || !ObjectId.isValid(jobId)) {
        res.status(400).json({
            success: false,
            error: "Invalid job ID",
        });
        return;
    }

    // Fetch the job and check ownership
    const updatedJob = await Job.findByIdAndUpdate(jobId, req.body, { new: true });

    if (!updatedJob) {
        res.status(404).json({
            success: false,
            error: ERROR_STRINGS.JobNotFound,
        });
        return;
    }

    res.status(200).json({
        success: true,
        message: SUCCESS_STRINGS.JobUpdated,
        job: updatedJob,
    });
}

export const archiveJob = async (req: AuthenticatedRequest, res: Response) => {
    const { jobId } = req.params;
    const { archive } = req.body;

    if (!jobId || !ObjectId.isValid(jobId)) {
        res.status(400).json({
            success: false,
            error: "Invalid job ID",
        });
        return;
    }

    // Ensure `archive` query parameter is valid
    if (typeof archive !== "boolean") {
        res.status(400).json({
            success: false,
            error: "Invalid 'archive' query parameter. Expected 'true' or 'false'.",
        });
        return;
    }

    // Fetch the job and check ownership
    const updatedJob = await Job.findByIdAndUpdate(jobId, { isArchived: archive }, { new: true });

    if (!updatedJob) {
        res.status(404).json({
            success: false,
            error: ERROR_STRINGS.JobNotFound,
        });
        return;
    }

    res.status(200).json({
        success: true,
        message: `Job has been successfully ${archive ? "archived" : "unarchived"}.`,
        job: updatedJob,
    });
};

export const deleteJob = async (req: AuthenticatedRequest, res: Response) => {
    const { jobId } = req.params;

    if (!jobId || !ObjectId.isValid(jobId)) {
        res.status(400).json({
            success: false,
            error: "Invalid job ID",
        });
        return;
    }

    // Fetch the job and check ownership
    const deletedJob = await Job.findByIdAndDelete(jobId);

    if (!deletedJob) {
        res.status(404).json({
            success: false,
            error: ERROR_STRINGS.JobNotFound,
        });
        return;
    }

    // Delete all applications associated with the job
    await Application.deleteMany({ jobId });

    res.status(200).json({
        success: true,
        message: SUCCESS_STRINGS.JobDeleted,
        job: deletedJob,
    });
}

export const bulkArchive = async (req: AuthenticatedRequest, res: Response) => {
    const { profileId: employerId } = req;
    const { jobIds, archive } = req.body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
        res.status(400).json({
            success: false,
            error: "jobIds must be a non-empty array",
        });
        return;
    }

    if (typeof archive !== "boolean") {
        res.status(400).json({
            success: false,
            error: "archive must be a boolean",
        });
        return;
    }

    const result = await Job.updateMany(
        { _id: { $in: jobIds.map(id => new ObjectId(id)) }, postedBy: new ObjectId(employerId) },
        { $set: { isArchived: archive } }
    );

    res.status(200).json({
        success: true,
        message: `Jobs have been successfully ${archive ? "archived" : "unarchived"}.`,
        modifiedCount: result.modifiedCount,
    });
};

export const bulkDelete = async (req: AuthenticatedRequest, res: Response) => {
    const { profileId: employerId } = req;
    const { jobIds } = req.body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
        res.status(400).json({
            success: false,
            error: "jobIds must be a non-empty array",
        });
        return;
    }

    // Convert jobIds to ObjectId instances
    const objectIds = jobIds.map(id => new ObjectId(id));

    const result = await Job.deleteMany({
        _id: { $in: objectIds },
        postedBy: new ObjectId(employerId),
    });

    // Delete applications associated with the deleted jobs
    await Application.deleteMany({ jobId: { $in: objectIds } });

    res.status(200).json({
        success: true,
        message: SUCCESS_STRINGS.JobDeleted,
        deletedCount: result.deletedCount,
    });
};

export const getJobApplications = async (req: AuthenticatedRequest, res: Response) => {
    const { profileId: employerId } = req;
    const { jobId } = req.body;

    if (!jobId || !ObjectId.isValid(jobId)) {
        res.status(400).json({
            success: false,
            error: "Invalid job ID",
        });
        return;
    }

    // Verify the job belongs to the employer
    const job = await Job.findById(jobId);
    if (!job) {
        res.status(404).json({
            success: false,
            error: ERROR_STRINGS.JobNotFound,
        });
        return;
    }

    if (job.postedBy.toString() !== employerId) {
        res.status(403).json({
            success: false,
            error: "You do not have access to this job's applications",
        });
        return;
    }

    // Fetch applications for the job and populate applicant details
    const applications = await Application.find({ jobId })
        .populate({
            path: "applicantId",
            model: "Applicant",
            select: "fullName contactEmail phoneNumber photoUrl resumeURL socialLinks",
        });

    // Check if there are applications
    if (!applications || applications.length === 0) {
        res.status(404).json({
            success: false,
            message: "No applications found for this job",
        });
        return;
    }

    res.status(200).json({ success: true, applications });
}

export const updateJobApplication = async (req: AuthenticatedRequest, res: Response) => {
    const { profileId: employerId } = req; // Authenticated employer's ID
    const { applicationId, jobId, status, feedback, notes, interviewDate } = req.body;

    // Verify the job exists and belongs to the employer
    const job = await Job.findById(jobId);
    if (!job) {
        res.status(404).json({
            success: false,
            error: ERROR_STRINGS.JobNotFound,
        });
        return;
    }

    if (job.postedBy.toString() !== employerId) {
        res.status(403).json({
            success: false,
            error: ERROR_STRINGS.ForbiddenAction,
        });
        return;
    }

    // Verify the application exists and is associated with the given job
    const application = await Application.findOne({ _id: applicationId, jobId });
    if (!application) {
        res.status(404).json({
            success: false,
            error: ERROR_STRINGS.ApplicationNotFound,
        });
        return;
    }

    // Update the fields
    if (status) application.status = status;
    if (feedback !== undefined) application.feedback = feedback;
    if (notes !== undefined) application.notes = notes;
    if (interviewDate !== undefined) application.interviewDate = interviewDate;

    // Save the updated application
    await application.save();
    res.status(200).json({
        success: true,
        message: SUCCESS_STRINGS.ApplicationUpdated,
        application,
    });
}