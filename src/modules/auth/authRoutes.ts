import { Router } from "express";
import { changePassword, createTestToken, googleCallback, login, logout, refreshAccessToken, register } from "./authController";
import { validate } from "../../middlewares/validationMiddleware";
import { changePasswordSchema, loginSchema, registerSchema } from "./authValidator";
import CONFIG from "../../config/config";
import passport from './strategies/google.strategy';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/change-password', validate(changePasswordSchema), changePassword);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', logout);

// test only
// router.get('/test-token', createTestToken) 

// Google OAuth routes
router.get('/google', (req, res, next) => {
  const origin = req.query.origin as string || CONFIG.ALLOWED_ORIGINS[0];
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state: origin
  })(req, res, next);
});

router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err: any, user: any) => {
      if (err || !user) {
        const origin = req.query.state as string || CONFIG.ALLOWED_ORIGINS[0];
        const safeOrigin = CONFIG.ALLOWED_ORIGINS.includes(origin) 
          ? origin 
          : CONFIG.ALLOWED_ORIGINS[0];
        return res.redirect(`${safeOrigin}/login?error=oauth_failed`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  googleCallback
);

export default router;