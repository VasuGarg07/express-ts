import { Router } from "express";
import { isAuthorized } from "../middlewares/roleMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import { applicantPreferenceSchema, applicantSchema, applicantUpdateSchema, employerSchema, employerUpdateSchema, jobSchema, jobUpdateSchema } from "../validators/jobscapeValidators";


// User Profile
const profileRouter = Router();
profileRouter.get('/profile'); // Get Profile
profileRouter.post('/register/applicant', validate(applicantSchema)); // Register as Applicant
profileRouter.post('/register/employer', validate(employerSchema)); // Register as Employer
profileRouter.delete('/account'); // Delete Account

// Employer Dashboard
const employerRouter = Router();
employerRouter.patch('/profile/update', validate(employerUpdateSchema)); // Update Profile

// Job Listing & Analytics
employerRouter.get('/dashboard'); // Dashboard Analytics (Jobs and Applications)
employerRouter.get('/jobs'); // List of All Jobs created

// Individual Job Management
employerRouter.post('/jobs', validate(jobSchema)); // Create New Job
employerRouter.get('/jobs/:jobId'); // Get details of Single Job
employerRouter.patch('/jobs/:jobId', validate(jobUpdateSchema)); // Update Job Contents
employerRouter.delete('/jobs/:jobId'); // Delete Job
employerRouter.patch('/jobs/:jobId/archive'); // Mark Job as Archive

// Bulk Job Management
employerRouter.post('/jobs/archive', validate(jobSchema)); // Archive Multiple Jobs
employerRouter.delete('/jobs/clear'); // Delete Multiple Jobs

// Application Management
employerRouter.get('/applications/:jobId'); // Get applications of a single job
employerRouter.post('/applications/status'); // job Id, applicant Id & status in request body


// Applicant Dashboard
const applicantRouter = Router();
applicantRouter.patch('/profile/update', validate(applicantUpdateSchema)); // Update Profile

// Job Listing & Analytics
applicantRouter.get('/dashboard'); // Dashboard Analytics (Applied Jobs and Status)
applicantRouter.get('/recommended-jobs'); // List Recommended Jobs
applicantRouter.patch('/preferences', validate(applicantPreferenceSchema));

// Job Management
applicantRouter.get('/jobs'); // All Jobs Listed
applicantRouter.get('/jobs/:jobId'); // Get details of Single Job
applicantRouter.post('/jobs/:jobId/apply'); // Apply for Job
applicantRouter.get('/jobs/:jobId/status'); // Check status of Job

// Application Management
applicantRouter.get('/applications/:applicantId') // Get All Applied Jobs
applicantRouter.get('/applications/:id/status') // Get status of job applied by ApplicationId

// Saved Jobs
applicantRouter.get('/saved-jobs'); // Saved Jobs
applicantRouter.post('/jobs/:jobId/save'); // Get details of Single Job
applicantRouter.delete('/saved-jobs/:jobId'); // Delete Saved Job


// Main Router
const router = Router();
router.use('/', profileRouter);
router.use('/', isAuthorized(['employer']), employerRouter);
router.use('/', isAuthorized(['applicant']), applicantRouter);

export default router;