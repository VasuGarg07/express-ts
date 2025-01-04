import { Response } from 'express';
import { Auth, ObjectId } from 'mongodb';
import { Application } from '../models/jobscape/applicationModel';
import { Job } from '../models/jobscape/jobModel';
import { AuthenticatedRequest } from '../types';
import { ERROR_STRINGS, SUCCESS_STRINGS } from '../utils/response.string';
