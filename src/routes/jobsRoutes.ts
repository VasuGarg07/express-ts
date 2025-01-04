import { Router } from "express";
import { deleteAccount, getProfile, registerApplicant, registerEmployer, updateProfile } from "../controllers/jobs.profileController";
import { jobRoleBasedValidation } from "../middlewares/jobRoleBasedValidation";
import { isAuthorized } from "../middlewares/roleMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import { asyncHandler } from "../utils/utilities";
import { applicantPreferenceSchema, applicantSchema, employerSchema, jobSchema, jobUpdateSchema, updateApplicationStatusSchema } from "../validators/jobscapeValidators";
import { archiveJob, bulkArchive, bulkDelete, deleteJob, getAllJobsByEmployer, getDashboardAnalytics, getJobApplications, getJobDetails, postJob, updateJob, updateJobApplication } from "../controllers/jobs.employerController";


// User Profile
const profileRouter = Router();
profileRouter.get('/profile', asyncHandler(getProfile));
profileRouter.post('/register/applicant', validate(applicantSchema), asyncHandler(registerApplicant));
profileRouter.post('/register/employer', validate(employerSchema), asyncHandler(registerEmployer));
profileRouter.patch('/profile/update', jobRoleBasedValidation, asyncHandler(updateProfile));
profileRouter.delete('/account/:accountId', asyncHandler(deleteAccount)); // TODO: To be tested

// Employer Dashboard
const employerRouter = Router();

// Job Listing & Analytics
employerRouter.get('/dashboard', asyncHandler(getDashboardAnalytics)); // TODO: Test again after applicant implementation
employerRouter.get('/jobs', asyncHandler(getAllJobsByEmployer));

// Individual Job Management
employerRouter.post('/jobs/new', validate(jobSchema), asyncHandler(postJob));
employerRouter.get('/jobs/:jobId', asyncHandler(getJobDetails));
employerRouter.patch('/jobs/:jobId/update', validate(jobUpdateSchema), asyncHandler(updateJob));
employerRouter.delete('/jobs/:jobId/delete', asyncHandler(deleteJob));
employerRouter.patch('/jobs/:jobId/archive', asyncHandler(archiveJob));

// Bulk Job Management
employerRouter.post('/jobs/archive', asyncHandler(bulkArchive));
employerRouter.delete('/jobs/clear', asyncHandler(bulkDelete));

// Application Management
employerRouter.get('/applications/:jobId', asyncHandler(getJobApplications));
employerRouter.post('/applications/status', validate(updateApplicationStatusSchema), asyncHandler(updateJobApplication));


// Applicant Dashboard
const applicantRouter = Router();

// Job Management
applicantRouter.get('/jobs'); // All Jobs Listed
applicantRouter.get('/jobs/:jobId'); // Get details of Single Job
applicantRouter.post('/jobs/:jobId/apply'); // Apply for Job
applicantRouter.get('/jobs/:jobId/status'); // Check status of Job

// Application Management
applicantRouter.get('/applications/:applicantId') // Get All Applied Jobs
applicantRouter.get('/applications/:id/status') // Get status of job applied by ApplicationId

// Saved Jobs
applicantRouter.post('/jobs/:jobId/save'); // Get details of Single Job
applicantRouter.get('/saved-jobs'); // Saved Jobs
applicantRouter.delete('/saved-jobs/:jobId'); // Delete Saved Job

// Job Listing & Analytics
applicantRouter.get('/dashboard'); // Dashboard Analytics (Applied Jobs and Status)
applicantRouter.get('/recommended-jobs'); // List Recommended Jobs
applicantRouter.patch('/preferences', validate(applicantPreferenceSchema)); // Update job preferences


// Main Router
const router = Router();
router.use('/', profileRouter);
router.use('/employer', isAuthorized(['employer']), employerRouter);
router.use('/applicant', isAuthorized(['applicant']), applicantRouter);

export default router;