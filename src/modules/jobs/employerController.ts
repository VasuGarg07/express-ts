import { Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { Applicant } from "./applicantModel";
import { Job } from "./jobModel";
import mongoose from "mongoose";

// ==================== GET MY JOBS ====================

export const getMyJobs = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const profileId = res.locals.profileId;

        const jobs = await Job.find({ postedBy: profileId })
            .select('-applications')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ jobs, count: jobs.length });
    } catch (error) {
        console.error("Get My Jobs Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==================== CREATE JOB ====================

export const createJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const profileId = res.locals.profileId;

        const job = new Job({
            postedBy: profileId,
            ...req.body
        });

        await job.save();

        res.status(201).json({ message: "Job created successfully", job });
    } catch (error) {
        console.error("Create Job Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==================== GET JOB WITH APPLICATIONS ====================

export const getJobWithApplications = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const profileId = res.locals.profileId;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: "Invalid job ID" });
            return;
        }

        // Find job and verify ownership
        const job = await Job.findOne({ _id: id, postedBy: profileId }).populate({
            path: 'applications.applicantId',
            select: 'fullName contactEmail phoneNumber photoUrl resumeURL socialLinks'
        });

        if (!job) {
            res.status(404).json({ error: "Job not found or unauthorized" });
            return;
        }

        res.status(200).json({ job });
    } catch (error) {
        console.error("Get Job With Applications Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==================== UPDATE JOB ====================

export const updateJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const profileId = res.locals.profileId;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: "Invalid job ID" });
            return;
        }

        // Update and verify ownership
        const job = await Job.findOneAndUpdate(
            { _id: id, postedBy: profileId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!job) {
            res.status(404).json({ error: "Job not found or unauthorized" });
            return;
        }

        res.status(200).json({ message: "Job updated successfully", job });
    } catch (error) {
        console.error("Update Job Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==================== DELETE JOB ====================
// Cascades to remove from applicants' savedJobs and applications

export const deleteJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const profileId = res.locals.profileId;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: "Invalid job ID" });
            return;
        }

        // Delete and verify ownership
        const job = await Job.findOneAndDelete({ _id: id, postedBy: profileId });

        if (!job) {
            res.status(404).json({ error: "Job not found or unauthorized" });
            return;
        }

        // Remove from all applicants' savedJobs and applications
        await Applicant.updateMany(
            {},
            {
                $pull: {
                    savedJobs: job._id,
                    applications: { jobId: job._id }
                }
            }
        );

        res.status(200).json({ message: "Job deleted successfully" });
    } catch (error) {
        console.error("Delete Job Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==================== TOGGLE ARCHIVE JOB ====================

export const toggleArchiveJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const profileId = res.locals.profileId;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: "Invalid job ID" });
            return;
        }

        // Find job and verify ownership
        const job = await Job.findOne({ _id: id, postedBy: profileId });

        if (!job) {
            res.status(404).json({ error: "Job not found or unauthorized" });
            return;
        }

        // Toggle archive status
        job.isArchived = !job.isArchived;
        await job.save();

        const status = job.isArchived ? "archived" : "unarchived";
        res.status(200).json({ message: `Job ${status} successfully`, isArchived: job.isArchived });
    } catch (error) {
        console.error("Toggle Archive Job Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};