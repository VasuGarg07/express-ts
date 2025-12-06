import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { Applicant } from "./applicantModel";
import { Employer } from "./employerModel";
import { Job } from "./jobModel";
import mongoose from "mongoose";

// ==================== GET JOBS ====================
// List all active jobs with pagination and search

export const getJobs = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string || "";
        const location = req.query.location as string || "";

        const skip = (page - 1) * limit;

        // Build query
        const query: any = { isArchived: false };

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        // Get jobs with company info
        const jobs = await Job.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'employers',
                    localField: 'postedBy',
                    foreignField: '_id',
                    as: 'employer'
                }
            },
            { $unwind: '$employer' },
            {
                $addFields: {
                    applicationCount: { $size: '$applications' },
                    companyName: '$employer.companyName',
                    logoURL: '$employer.logoURL'
                }
            },
            {
                $project: {
                    id: '$_id',
                    title: 1,
                    location: 1,
                    employmentType: 1,
                    salaryRange: 1,
                    applicationCount: 1,
                    companyName: 1,
                    logoURL: 1,
                    createdAt: 1,
                    _id: 0
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        const total = await Job.countDocuments(query);

        res.status(200).json({
            jobs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get Jobs Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==================== GET JOB DETAILS ====================
// Get single job with company info

export const getJobDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: "Invalid job ID" });
            return;
        }

        const job = await Job.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id), isArchived: false } },
            {
                $lookup: {
                    from: 'employers',
                    localField: 'postedBy',
                    foreignField: '_id',
                    as: 'employer'
                }
            },
            { $unwind: '$employer' },
            {
                $addFields: {
                    applicationCount: { $size: '$applications' },
                    companyName: '$employer.companyName',
                    logoURL: '$employer.logoURL'
                }
            },
            {
                $project: {
                    applications: 0,
                    employer: 0,
                    __v: 0
                }
            }
        ]);

        if (!job.length) {
            res.status(404).json({ error: "Job not found" });
            return;
        }

        res.status(200).json({ job: job[0] });
    } catch (error) {
        console.error("Get Job Details Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==================== APPLY TO JOB ====================

export const applyToJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const profileId = res.locals.profileId;
        const { id } = req.params;
        const { coverLetter } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: "Invalid job ID" });
            return;
        }

        // Check if job exists and not archived
        const job = await Job.findOne({ _id: id, isArchived: false });
        if (!job) {
            res.status(404).json({ error: "Job not found" });
            return;
        }

        // Check if already applied
        const applicant = await Applicant.findById(profileId);
        if (!applicant) {
            res.status(404).json({ error: "Applicant profile not found" });
            return;
        }

        const alreadyApplied = applicant.applications.some(
            app => app.jobId.toString() === id
        );

        if (alreadyApplied) {
            res.status(400).json({ error: "Already applied to this job" });
            return;
        }

        // Add to applicant's applications
        applicant.applications.push({
            jobId: new mongoose.Types.ObjectId(id),
            coverLetter,
            appliedAt: new Date()
        });
        await applicant.save();

        // Add to job's applications
        job.applications.push({
            applicantId: new mongoose.Types.ObjectId(profileId),
            coverLetter,
            appliedAt: new Date()
        });
        await job.save();

        res.status(201).json({ message: "Application submitted successfully" });
    } catch (error) {
        console.error("Apply to Job Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==================== GET MY APPLICATIONS ====================

export const getMyApplications = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const profileId = res.locals.profileId;

        const applicant = await Applicant.findById(profileId).populate({
            path: 'applications.jobId',
            select: 'title location employmentType salaryRange postedBy',
            populate: {
                path: 'postedBy',
                select: 'companyName logoURL'
            }
        });

        if (!applicant) {
            res.status(404).json({ error: "Applicant profile not found" });
            return;
        }

        // Format response
        const applications = applicant.applications.map((app: any) => ({
            id: app.jobId._id,
            title: app.jobId.title,
            location: app.jobId.location,
            employmentType: app.jobId.employmentType,
            salaryRange: app.jobId.salaryRange,
            companyName: app.jobId.postedBy.companyName,
            logoURL: app.jobId.postedBy.logoURL,
            appliedAt: app.appliedAt.getTime(),
            coverLetter: app.coverLetter
        }));

        res.status(200).json({ applications });
    } catch (error) {
        console.error("Get My Applications Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==================== TOGGLE SAVE JOB ====================

export const toggleSaveJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const profileId = res.locals.profileId;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: "Invalid job ID" });
            return;
        }

        // Check if job exists
        const job = await Job.findOne({ _id: id, isArchived: false });
        if (!job) {
            res.status(404).json({ error: "Job not found" });
            return;
        }

        const applicant = await Applicant.findById(profileId);
        if (!applicant) {
            res.status(404).json({ error: "Applicant profile not found" });
            return;
        }

        const jobObjectId = new mongoose.Types.ObjectId(id);
        const isSaved = applicant.savedJobs.some(
            savedId => savedId.toString() === id
        );

        if (isSaved) {
            // Remove from saved
            applicant.savedJobs = applicant.savedJobs.filter(
                savedId => savedId.toString() !== id
            );
            await applicant.save();
            res.status(200).json({ message: "Job removed from saved", saved: false });
        } else {
            // Add to saved
            applicant.savedJobs.push(jobObjectId);
            await applicant.save();
            res.status(200).json({ message: "Job saved successfully", saved: true });
        }
    } catch (error) {
        console.error("Toggle Save Job Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==================== GET SAVED JOBS ====================

export const getSavedJobs = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const profileId = res.locals.profileId;

        const applicant = await Applicant.findById(profileId).populate({
            path: 'savedJobs',
            match: { isArchived: false },
            select: 'title location employmentType salaryRange postedBy',
            populate: {
                path: 'postedBy',
                select: 'companyName logoURL'
            }
        });

        if (!applicant) {
            res.status(404).json({ error: "Applicant profile not found" });
            return;
        }

        // Format response
        const savedJobs = applicant.savedJobs.map((job: any) => ({
            id: job._id,
            title: job.title,
            location: job.location,
            employmentType: job.employmentType,
            salaryRange: job.salaryRange,
            companyName: job.postedBy.companyName,
            logoURL: job.postedBy.logoURL
        }));

        res.status(200).json({ savedJobs });
    } catch (error) {
        console.error("Get Saved Jobs Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==================== GET COMPANIES ====================

export const getCompanies = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string || "";

        const skip = (page - 1) * limit;

        // Build query
        const query: any = {};
        if (search) {
            query.companyName = { $regex: search, $options: 'i' };
        }

        const companies = await Employer.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'jobs',
                    let: { employerId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$postedBy', '$$employerId'] },
                                        { $eq: ['$isArchived', false] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'jobs'
                }
            },
            {
                $addFields: {
                    activeJobsCount: { $size: '$jobs' }
                }
            },
            {
                $project: {
                    id: '$_id',
                    companyName: 1,
                    logoURL: 1,
                    address: 1,
                    activeJobsCount: 1,
                    _id: 0
                }
            },
            { $skip: skip },
            { $limit: limit }
        ]);

        const total = await Employer.countDocuments(query);

        res.status(200).json({
            companies,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get Companies Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==================== GET COMPANY DETAILS ====================

export const getCompanyDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: "Invalid company ID" });
            return;
        }

        const company = await Employer.findById(id);
        if (!company) {
            res.status(404).json({ error: "Company not found" });
            return;
        }

        // Get active jobs
        const jobs = await Job.find({ postedBy: id, isArchived: false })
            .select('title location employmentType salaryRange createdAt')
            .lean();

        // Format jobs
        const formattedJobs = jobs.map(job => ({
            id: job._id,
            title: job.title,
            location: job.location,
            employmentType: job.employmentType,
            salaryRange: job.salaryRange,
            companyName: company.companyName,
            logoURL: company.logoURL
        }));

        res.status(200).json({
            company,
            jobs: formattedJobs,
            jobCount: formattedJobs.length
        });
    } catch (error) {
        console.error("Get Company Details Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};