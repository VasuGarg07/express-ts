import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { compareData, hashData } from '../../utils/utilities';
import User from './userModel';
import { ERROR_STRINGS, SUCCESS_STRINGS } from '../../utils/response.string';
import RefreshToken from './refreshTokenModel';
import CONFIG from '../../config/config';

const secretKey = CONFIG.SECRET_KEY;

// TODO: Test Function for Dev Setup
export const createTestToken = (req: Request, res: Response, next: NextFunction) => {
    const { id, username, email } = req.body;
    const accessToken = jwt.sign({ id, username, email }, secretKey, {
        expiresIn: '1d',
    });
    res.status(200).json({ message: 'Token Generated', accessToken });
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password, confirmPassword, securityQuestion, securityAnswer } = req.body;
    const user = await User.findOne({
        $or: [{ username: username }, { email: username }],
    });

    if (user) {
        res.status(409).json({ error: "User Already Exists", id: user._id });
        return;
    }

    try {
        const hashedPassword = await hashData(password);
        const hashedSecurityAnswer = await hashData(securityAnswer);

        const newUser = new User({
            username, email, securityQuestion,
            password: hashedPassword,
            securityAnswer: hashedSecurityAnswer
        });
        const user = await newUser.save();
        res.status(201).json({ message: SUCCESS_STRINGS.UserCreated, id: user._id })
    } catch (error) {
        next(error);
    }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;

    try {
        // Validate input
        if (!username || !password) {
            res.status(400).json({ error: ERROR_STRINGS.InvalidCreds });
            return;
        }

        // Check if user exists (user can be username or email)
        const user = await User.findOne({
            $or: [{ username: username }, { email: username }],
        });
        if (!user) {
            res.status(404).json({ error: ERROR_STRINGS.InvalidCreds });
            return;
        }

        const isPasswordValid = await compareData(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: ERROR_STRINGS.InvalidCreds });
            return;
        }

        const accessToken = jwt.sign({ id: user._id, username: user.username, email: user.email }, secretKey, {
            expiresIn: '2h',
        });
        const refreshToken = jwt.sign({ id: user._id, username: user.username, email: user.email }, secretKey, {
            expiresIn: '1d',
        });
        await RefreshToken.create({
            token: refreshToken,
            userId: user._id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        });

        res.status(200).json({ message: 'Login successful', accessToken, refreshToken });
    } catch (error) {
        next(error);
    }
}

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    const { username, securityAnswer, newPassword, confirmPassword } = req.body;

    try {
        const user = await User.findOne({
            $or: [{ username }, { email: username }],
        });
        if (!user) {
            res.status(404).json({ error: ERROR_STRINGS.InvalidCreds });
            return;
        }

        const isAnswerValid = await compareData(securityAnswer, user.securityAnswer);
        if (!isAnswerValid) {
            res.status(401).json({ error: ERROR_STRINGS.InvalidCreds });
            return;
        }

        user.password = await hashData(newPassword);
        await user.save();
        res.status(200).json({ message: SUCCESS_STRINGS.PasswordChanged });
    } catch (error) {
        next(error);
    }
}

export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;

    try {
        if (!refreshToken) {
            res.status(400).json({ error: ERROR_STRINGS.NoRefToken });
            return;
        }

        // Check if token exists in DB first
        const storedToken = await RefreshToken.findOne({ token: refreshToken });
        if (!storedToken) {
            res.status(401).json({ error: ERROR_STRINGS.InvalidToken });
            return;
        }

        // Verify the refresh token
        jwt.verify(refreshToken, secretKey, async (err: any, decoded: any) => {
            if (err) {
                // Token is invalid/expired — clean it up from DB
                await RefreshToken.deleteOne({ token: refreshToken });
                res.status(401).json({ error: ERROR_STRINGS.InvalidToken });
                return;
            }

            // Check if the user still exists
            const user = await User.findById(decoded.id);
            if (!user) {
                res.status(404).json({ error: ERROR_STRINGS.UserNotFound });
                return;
            }

            // Rotate — delete old token, issue new ones
            await RefreshToken.deleteOne({ token: refreshToken });

            const accessToken = jwt.sign(
                { id: user._id, username: user.username, email: user.email },
                secretKey,
                { expiresIn: '2h' }
            );
            const newRefreshToken = jwt.sign(
                { id: user._id, username: user.username, email: user.email },
                secretKey,
                { expiresIn: '1d' }
            );

            await RefreshToken.create({
                token: newRefreshToken,
                userId: user._id,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            });

            res.status(200).json({ 
                message: SUCCESS_STRINGS.TokenRefreshed, 
                accessToken,
                refreshToken: newRefreshToken
            });
        });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;
    try {
        await RefreshToken.deleteOne({ token: refreshToken });
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};
