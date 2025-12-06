import { Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { Applicant } from "./applicantModel";
import { Employer } from "./employerModel";
import { Job } from "./jobModel";

// ==================== GET PROFILE ====================
// Returns profile based on detected role

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const role = res.locals.role;
        const profileId = res.locals.profileId;

        if (role === "applicant") {
            const profile = await Applicant.findById(profileId);
            res.status(200).json({ role, profile });
            return;
        }

        if (role === "employer") {
            const profile = await Employer.findById(profileId);
            res.status(200).json({ role, profile });
            return;
        }

        res.status(404).json({ error: "Profile not found" });
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==================== REGISTER APPLICANT ====================

export const registerApplicant = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        // Check if already exists
        const existing = await Applicant.findOne({ userId });
        if (existing) {
            res.status(400).json({ error: "Applicant profile already exists" });
            return;
        }

        // Create new applicant
        const applicant = new Applicant({ userId, ...req.body });
        await applicant.save();

        res.status(201).json({ message: "Applicant registered successfully", profile: applicant });
    } catch (error) {
        console.error("Register Applicant Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==================== REGISTER EMPLOYER ====================

export const registerEmployer = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        // Check if already exists
        const existing = await Employer.findOne({ userId });
        if (existing) {
            res.status(400).json({ error: "Employer profile already exists" });
            return;
        }

        // Create new employer
        const employer = new Employer({ userId, ...req.body });
        await employer.save();

        res.status(201).json({ message: "Employer registered successfully", profile: employer });
    } catch (error) {
        console.error("Register Employer Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==================== UPDATE PROFILE ====================

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const role = res.locals.role;
        const profileId = res.locals.profileId;

        if (role === "applicant") {
            const updated = await Applicant.findByIdAndUpdate(
                profileId,
                req.body,
                { new: true, runValidators: true }
            );

            if (!updated) {
                res.status(404).json({ error: "Profile not found" });
                return;
            }

            res.status(200).json({ message: "Profile updated successfully", profile: updated });
            return;
        }

        if (role === "employer") {
            const updated = await Employer.findByIdAndUpdate(
                profileId,
                req.body,
                { new: true, runValidators: true }
            );

            if (!updated) {
                res.status(404).json({ error: "Profile not found" });
                return;
            }

            res.status(200).json({ message: "Profile updated successfully", profile: updated });
            return;
        }

        res.status(400).json({ error: "Invalid role" });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==================== DELETE ACCOUNT ====================
// Cascades deletes based on role

export const deleteAccount = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const role = res.locals.role;
        const profileId = res.locals.profileId;
        const { id } = req.params;

        // Verify the ID matches the authenticated user's profile
        if (id !== profileId) {
            res.status(403).json({ error: "Unauthorized to delete this account" });
            return;
        }

        if (role === "applicant") {
            // Delete applicant profile
            const deleted = await Applicant.findByIdAndDelete(profileId);

            if (!deleted) {
                res.status(404).json({ error: "Profile not found" });
                return;
            }

            // Remove applicant from all job applications
            await Job.updateMany(
                { "applications.applicantId": profileId },
                { $pull: { applications: { applicantId: profileId } } }
            );

            res.status(200).json({ message: "Applicant account deleted successfully" });
            return;
        }

        if (role === "employer") {
            // Find all jobs posted by employer
            const jobs = await Job.find({ postedBy: profileId }).select('_id').lean();
            const jobIds = jobs.map(job => job._id);

            // Delete all jobs
            await Job.deleteMany({ postedBy: profileId });

            // Remove these jobs from all applicants' savedJobs and applications
            await Applicant.updateMany(
                {},
                {
                    $pull: {
                        savedJobs: { $in: jobIds },
                        applications: { jobId: { $in: jobIds } }
                    }
                }
            );

            // Delete employer profile
            const deleted = await Employer.findByIdAndDelete(profileId);

            if (!deleted) {
                res.status(404).json({ error: "Profile not found" });
                return;
            }

            res.status(200).json({ message: "Employer account deleted successfully" });
            return;
        }

        res.status(400).json({ error: "Invalid role" });
    } catch (error) {
        console.error("Delete Account Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};