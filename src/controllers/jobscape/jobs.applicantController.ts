import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { Employer } from '../../models/jobscape/employerModel';
import { Job } from '../../models/jobscape/jobModel';
import { AuthenticatedRequest } from '../../types';
import { ERROR_STRINGS, SUCCESS_STRINGS } from '../../utils/response.string';
import { SavedJob } from '../../models/jobscape/savedJobs';
import { Applicant, IPreference } from '../../models/jobscape/applicantModel';
import { Application } from '../../models/jobscape/applicationModel';
import mongoose from 'mongoose';

export const getJobsList = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.name ? (req.query.name as string) : "";

    const matchStage: any = { isArchived: false };

    // If search query is provided, add regex filtering
    if (searchQuery) {
        matchStage.title = { $regex: searchQuery, $options: "i" }; // Case-insensitive substring search
    }

    const jobs = await Job.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: "employers",
                localField: "postedBy",
                foreignField: "_id",
                as: "employerDetails"
            }
        },
        {
            $lookup: {
                from: "applications",
                localField: "_id",
                foreignField: "jobId",
                as: "applications"
            }
        },
        {
            $addFields: {
                companyName: { $arrayElemAt: ["$employerDetails.companyName", 0] },
                logoURL: { $arrayElemAt: ["$employerDetails.logoURL", 0] },
                totalApplicants: { $size: "$applications" }
            }
        },
        {
            $project: {
                id: "$_id", // Rename _id to id
                title: 1,
                location: 1,
                employmentType: 1,
                salaryRange: 1,
                isFeatured: 1,
                totalApplicants: 1,
                companyName: 1,
                logoURL: 1,
                _id: 0,
            }
        },
        { $skip: skip }, // Implement pagination
        { $limit: limit } // Limit results per page
    ]);

    res.status(200).json({
        success: true,
        jobs,
        count: jobs.length,
        page,
        limit
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

    const jobBriefing = await Job.aggregate([
        { $match: { _id: new ObjectId(jobId), isArchived: { $ne: true } } },

        // Lookup and count applications
        {
            $lookup: {
                from: "applications",
                localField: "_id",
                foreignField: "jobId",
                as: "applications",
            },
        },
        { $addFields: { applicationCount: { $size: "$applications" } } },
        { $project: { applications: 0 } }, // Remove applications array after counting

        // Lookup employer details
        {
            $lookup: {
                from: "employers",
                localField: "postedBy",
                foreignField: "_id",
                as: "employer",
            },
        },
        { $unwind: { path: "$employer", preserveNullAndEmptyArrays: true } },

        // Preserve full Job document dynamically & separate extra fields
        {
            $project: {
                job: {
                    $mergeObjects: [
                        "$$ROOT", // Include all Job fields dynamically
                        {
                            id: "$_id", // Convert _id to id
                            createdAt: { $toLong: "$createdAt" }, // Convert to timestamp
                            updatedAt: { $toLong: "$updatedAt" }, // Convert to timestamp
                        },
                    ],
                },
                applicationCount: 1,
                companyName: "$employer.companyName",
                logoURL: "$employer.logoURL",
            },
        },
        {
            $project: {
                "job._id": 0,
                "job.__v": 0,
            },
        },
    ]);

    if (!jobBriefing.length) {
        res.status(404).json({ success: false, error: ERROR_STRINGS.JobNotFound });
        return;
    }

    res.status(200).json({
        success: true,
        ...jobBriefing[0], // Includes job object + extra fields
    });
}

export const getCompaniesList = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const nameFilter = req.query.name as string;

    // Building the match filter dynamically
    const matchFilter: any = {};

    // If a name filter is provided, apply the substring search for companyName
    if (nameFilter) {
        matchFilter.companyName = { $regex: nameFilter, $options: "i" }; // 'i' for case-insensitive match
    }


    const companies = await Employer.aggregate([
        {
            $match: matchFilter
        },
        {
            $lookup: {
                from: "jobs",
                let: { employerId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$postedBy", "$$employerId"] },
                                    { $eq: ["$isArchived", false] } // Corrected to match the field name
                                ]
                            }
                        }
                    },
                    { $project: { _id: 1 } }
                ],
                as: "jobs"
            }
        },
        {
            $addFields: {
                activeJobsCount: { $size: "$jobs" }
            }
        },
        {
            $project: {
                id: "$_id", // Rename _id to id
                companyName: 1,
                logoURL: 1,
                address: 1,
                activeJobsCount: 1,
                _id: 0,
            }
        },
        { $skip: skip },
        { $limit: limit }
    ]);

    res.status(200).json({
        success: true,
        companies,
        count: companies.length,
        page,
        limit
    });
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

    const jobs = await Job.aggregate([
        {
            $match: {
                postedBy: new mongoose.Types.ObjectId(companyId),
                isArchived: false
            }
        },
        {
            $lookup: {
                from: "applications",
                localField: "_id",
                foreignField: "jobId",
                as: "applications"
            }
        },
        {
            $addFields: {
                totalApplicants: { $size: "$applications" }
            }
        },
        {
            $project: {
                id: "$_id",
                title: 1,
                location: 1,
                employmentType: 1,
                salaryRange: 1,
                isFeatured: 1,
                totalApplicants: 1,
                companyName: company.companyName,
                logoURL: company.logoURL,
                _id: 0
            }
        }
    ]);

    res.status(200).json({
        success: true, company, jobs, jobCount: jobs.length
    });
}

export const applyJob = async (req: AuthenticatedRequest, res: Response) => {
    const applicantId = req.profileId;
    const { jobId, coverLetter } = req.body;

    // Validate input
    if (!jobId) {
        res.status(400).json({ error: 'Job ID are required.' });
        return;
    }

    const hasApplied = await Application.findOne({ jobId, applicantId });
    if (hasApplied) {
        res.status(400).json({ error: ERROR_STRINGS.ApplicationExists })
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

    const jobs = await Job.aggregate([
        // Lookup applications to get the application status
        {
            $lookup: {
                from: "applications",
                let: { jobId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$jobId", "$$jobId"] },
                                    { $eq: ["$applicantId", new mongoose.Types.ObjectId(applicantId)] }
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            status: 1
                        }
                    }
                ],
                as: "applications"
            }
        },
        // Lookup employer details to get companyName and logoURL
        {
            $lookup: {
                from: "employers",
                localField: "postedBy",
                foreignField: "_id",
                as: "employerDetails"
            }
        },
        {
            $match: { isArchived: false }
        },
        // Extract relevant fields from lookup results
        {
            $addFields: {
                status: { $arrayElemAt: ["$applications.status", 0] },
                companyName: { $arrayElemAt: ["$employerDetails.companyName", 0] },
                logoURL: { $arrayElemAt: ["$employerDetails.logoURL", 0] }
            }
        },
        // Project only required fields
        {
            $project: {
                id: "$_id",
                title: 1,
                location: 1,
                employmentType: 1,
                salaryRange: 1,
                isFeatured: 1,
                companyName: 1,
                logoURL: 1,
                status: 1,
                _id: 0
            }
        }
    ]);

    if (jobs.length === 0) {
        res.status(200).json({ success: true, message: SUCCESS_STRINGS.NoApplications });
        return;
    }

    res.status(200).json({ jobs, count: jobs.length, success: false });
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

    res.status(200).json({ success: true, jobs, count: jobs.length });
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

    const deleteSaved = await SavedJob.findOneAndDelete({ jobId });

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

export const getRecommendedJobs = async (req: AuthenticatedRequest, res: Response) => {
    const applicantId = req.profileId;

    // Fetch applicant preferences
    const applicant = await Applicant.findById(applicantId);
    if (!applicant) {
        res.status(404).json({ error: ERROR_STRINGS.NoApplicant });
        return;
    }

    const preference = applicant.preference;

    const jobs = await Job.aggregate([
        { $match: { isArchived: false } },

        // Lookup employer details
        {
            $lookup: {
                from: "employers",
                localField: "postedBy",
                foreignField: "_id",
                as: "employerDetails"
            }
        },

        // Calculate match score (excluding salary & applications)
        {
            $addFields: {
                jobTypeMatch: { $cond: { if: { $eq: ["$employmentType", preference.jobType] }, then: 30, else: 0 } },
                locationMatch: { $cond: { if: { $in: ["$location", preference.locations] }, then: 30, else: 0 } },
                shiftMatch: { $cond: { if: { $eq: ["$shiftType", preference.shift] }, then: 30, else: 0 } },
                roleMatch: {
                    $cond: {
                        if: {
                            $gt: [{ $size: { $filter: { input: preference.role, as: "role", cond: { $regexMatch: { input: "$title", regex: "$$role", options: "i" } } } } }, 0]
                        },
                        then: 10, else: 0
                    }
                },
                companyName: { $arrayElemAt: ["$employerDetails.companyName", 0] },
                logoURL: { $arrayElemAt: ["$employerDetails.logoURL", 0] }
            }
        },

        // Calculate total match score
        {
            $addFields: {
                matchScore: {
                    $add: [
                        "$jobTypeMatch",
                        "$locationMatch",
                        "$shiftMatch",
                        "$roleMatch"
                    ]
                }
            }
        },

        // Filter jobs with matchScore >= 30
        { $match: { matchScore: { $gte: 30 } } },

        // Format output
        {
            $project: {
                id: "$_id",
                title: 1,
                location: 1,
                employmentType: 1,
                salaryRange: 1,
                isFeatured: 1,
                companyName: 1,
                logoURL: 1,
                matchScore: 1,
                _id: 0
            }
        },

        // Sort by best match
        { $sort: { matchScore: -1 } }
    ]);

    if (jobs.length === 0) {
        res.status(404).json({ message: "No recommended jobs found." });
        return;
    }

    res.status(200).json({ jobs, count: jobs.length });
};
