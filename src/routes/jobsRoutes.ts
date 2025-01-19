import { Router } from "express";
import { applyJob, deleteSavedJob, getAppliedJobs, getCompaniesList, getCompanyDetails, getJobBriefing, getJobsList, getRecommendedJobs, getSavedJobs, saveJob } from "../controllers/jobscape/jobs.applicantController";
import { archiveJob, bulkArchive, bulkDelete, deleteJob, getAllJobsByEmployer, getDashboardAnalytics, getJobApplications, getJobDetails, postJob, updateJob, updateJobApplication } from "../controllers/jobscape/jobs.employerController";
import { deleteAccount, getProfile, registerApplicant, registerEmployer, updateProfile } from "../controllers/jobscape/jobs.profileController";
import { jobRoleBasedValidation } from "../middlewares/jobRoleBasedValidation";
import { isAuthorized } from "../middlewares/roleMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import { asyncHandler } from "../utils/utilities";
import { applicantSchema, employerSchema, jobSchema, jobUpdateSchema, updateApplicationStatusSchema } from "../validators/jobscapeValidators";


// User Profile
const profileRouter = Router();
profileRouter.get('/profile', asyncHandler(getProfile));
profileRouter.post('/register/applicant', validate(applicantSchema), asyncHandler(registerApplicant));
profileRouter.post('/register/employer', validate(employerSchema), asyncHandler(registerEmployer));
profileRouter.patch('/profile/update', jobRoleBasedValidation, asyncHandler(updateProfile));
profileRouter.delete('/account/:accountId', asyncHandler(deleteAccount));

// Employer Dashboard
const employerRouter = Router();

// Job Listing & Analytics
employerRouter.get('/dashboard', asyncHandler(getDashboardAnalytics));
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
applicantRouter.get('/jobs', asyncHandler(getJobsList));
applicantRouter.get('/jobs/:jobId', asyncHandler(getJobBriefing));

// Company Details
applicantRouter.get('/companies', asyncHandler(getCompaniesList));
applicantRouter.get('/companies/:companyId', asyncHandler(getCompanyDetails));


// Application Management
applicantRouter.post('/jobs/apply', asyncHandler(applyJob));
applicantRouter.get('/applications', asyncHandler(getAppliedJobs));

// Saved Jobs
applicantRouter.post('/jobs/save', asyncHandler(saveJob));
applicantRouter.get('/saved-jobs', asyncHandler(getSavedJobs));
applicantRouter.delete('/saved-jobs/:jobId', asyncHandler(deleteSavedJob));

// Job Listing & Analytics
applicantRouter.get('/recommended', asyncHandler(getRecommendedJobs));


// Main Router
const router = Router();
router.use('/', profileRouter);
router.use('/employer', isAuthorized(['employer']), employerRouter);
router.use('/applicant', isAuthorized(['applicant']), applicantRouter);

export default router;