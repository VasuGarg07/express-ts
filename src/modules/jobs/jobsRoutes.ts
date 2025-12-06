import { Router } from "express";
import { validate, roleBasedValidate } from "./validationMiddleware";
import { extractRole, isApplicant, isEmployer } from "./roleMiddleware";
import {
    applicantSchema,
    employerSchema,
    jobSchema,
    jobUpdateSchema,
    applyJobSchema
} from "./jobValidators";

import {
    getProfile,
    registerApplicant,
    registerEmployer,
    updateProfile,
    deleteAccount
} from "./profileController";

import {
    getJobs,
    getJobDetails,
    applyToJob,
    getMyApplications,
    toggleSaveJob,
    getSavedJobs,
    getCompanies,
    getCompanyDetails
} from "./applicantController";

import {
    getMyJobs,
    createJob,
    getJobWithApplications,
    updateJob,
    deleteJob,
    toggleArchiveJob
} from "./employerController";

const router = Router();

// ==================== PROFILE ROUTES ====================

router.get('/profile', extractRole, getProfile);
router.post('/applicant/register', validate(applicantSchema), registerApplicant);
router.post('/employer/register', validate(employerSchema), registerEmployer);
router.patch('/profile', extractRole, roleBasedValidate, updateProfile);
router.delete('/account/:id', extractRole, deleteAccount);

// ==================== APPLICANT ROUTES ====================

const applicantRouter = Router();
applicantRouter.use(isApplicant); // All routes require applicant profile

// Jobs
applicantRouter.get('/jobs', getJobs);
applicantRouter.get('/jobs/:id', getJobDetails);
applicantRouter.post('/jobs/:id/apply', validate(applyJobSchema), applyToJob);

// Applications
applicantRouter.get('/applications', getMyApplications);

// Saved Jobs
applicantRouter.patch('/jobs/:id/save', toggleSaveJob);
applicantRouter.get('/saved-jobs', getSavedJobs);

// Companies
applicantRouter.get('/companies', getCompanies);
applicantRouter.get('/companies/:id', getCompanyDetails);

router.use('/applicant', applicantRouter);

// ==================== EMPLOYER ROUTES ====================

const employerRouter = Router();
employerRouter.use(isEmployer); // All routes require employer profile

// Jobs Management
employerRouter.get('/jobs', getMyJobs);
employerRouter.post('/jobs', validate(jobSchema), createJob);
employerRouter.get('/jobs/:id', getJobWithApplications);
employerRouter.patch('/jobs/:id', validate(jobUpdateSchema), updateJob);
employerRouter.delete('/jobs/:id', deleteJob);
employerRouter.patch('/jobs/:id/archive', toggleArchiveJob);

router.use('/employer', employerRouter);

export default router;