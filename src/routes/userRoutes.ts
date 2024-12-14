import { Router } from 'express';
import { getUsers } from '../controllers/userController';

const router = Router();

// Define routes for user operations
router.get('/', getUsers);

export default router;
