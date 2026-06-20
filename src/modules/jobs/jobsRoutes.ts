import { Router } from "express";
import { validate } from "../../middlewares/validationMiddleware";
import { roleBasedValidate } from "./middlewares/roleBasedValidate";
import { extractRole, isApplicant, isEmployer } from "./middlewares/roleMiddleware";
import {
    applicantSchema,
    employerSchema,
    jobSchema,
    jobUpdateSchema,
    applyJobSchema,
    applicationStatusSchema
} from "./validators/jobValidators";

import {
    getProfile,
    registerApplicant,
    registerEmployer,
    updateProfile,
    deleteAccount
} from "./controllers/profileController";

import {
    getJobs,
    getJobDetails,
    applyToJob,
    getMyApplications,
    toggleSaveJob,
    getSavedJobs,
    getCompanies,
    getCompanyDetails
} from "./controllers/applicantController";

import {
    getMyJobs,
    createJob,
    getJobWithApplications,
    updateJob,
    deleteJob,
    toggleArchiveJob,
    updateApplicationStatus
} from "./controllers/employerController";

const router = Router();

// PROFILE ROUTES
router.get('/profile', extractRole, getProfile);
router.post('/applicant/register', validate(applicantSchema), registerApplicant);
router.post('/employer/register', validate(employerSchema), registerEmployer);
router.patch('/profile', extractRole, roleBasedValidate, updateProfile);
router.delete('/account/:id', extractRole, deleteAccount);

// APPLICANT ROUTES
const applicantRouter = Router();
applicantRouter.use(isApplicant);
applicantRouter.get('/jobs', getJobs);
applicantRouter.get('/jobs/:id', getJobDetails);
applicantRouter.post('/jobs/:id/apply', validate(applyJobSchema), applyToJob);
applicantRouter.get('/applications', getMyApplications);
applicantRouter.patch('/jobs/:id/save', toggleSaveJob);
applicantRouter.get('/saved-jobs', getSavedJobs);
applicantRouter.get('/companies', getCompanies);
applicantRouter.get('/companies/:id', getCompanyDetails);
router.use('/applicant', applicantRouter);

// EMPLOYER ROUTES
const employerRouter = Router();
employerRouter.use(isEmployer);
employerRouter.get('/jobs', getMyJobs);
employerRouter.post('/jobs', validate(jobSchema), createJob);
employerRouter.get('/jobs/:id', getJobWithApplications);
employerRouter.patch('/jobs/:id', validate(jobUpdateSchema), updateJob);
employerRouter.delete('/jobs/:id', deleteJob);
employerRouter.patch('/jobs/:id/archive', toggleArchiveJob);
employerRouter.patch('/jobs/:id/applications/status', validate(applicationStatusSchema), updateApplicationStatus);
router.use('/employer', employerRouter);

export default router;