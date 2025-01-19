import { Router } from "express";
import { changePassword, login, refreshAccessToken, register } from "../controllers/authController";
import { validate } from "../middlewares/validationMiddleware";
import { changePasswordSchema, loginSchema, registerSchema } from "../validators/authValidator";

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/change-password', validate(changePasswordSchema), changePassword);
router.post('/refresh-token', refreshAccessToken);

export default router;