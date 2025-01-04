import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { compareData, hashData } from '../utils/utilities';
import User from '../models/userModel';
import { ERROR_STRINGS, SUCCESS_STRINGS } from '../utils/response.string';

const SECRET_KEY = process.env.JWT_SECRET || 'secretkey';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password, confirmPassword, securityQuestion, securityAnswer } = req.body;

    const user = await User.findOne({
        $or: [{ username: username }, { email: username }],
    });
    if (user) {
        res.status(404).json({ error: "User Already Exists", id: user._id });
        return;
    }

    try {
        if (password !== confirmPassword) {
            res.status(400).json({ error: ERROR_STRINGS.IncorrectPassword });
            return;
        }

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

        const accessToken = jwt.sign({ id: user._id, username: user.username, email: user.email }, SECRET_KEY, {
            expiresIn: '2h',
        });
        const refreshToken = jwt.sign({ id: user._id, username: user.username, email: user.email }, SECRET_KEY, {
            expiresIn: '1d',
        })
        res.status(200).json({ message: 'Login successful', accessToken, refreshToken });
    } catch (error) {
        next(error);
    }
}

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    const { username, securityAnswer, newPassword, confirmPassword } = req.body;

    try {
        if (newPassword !== confirmPassword) {
            res.status(400).json({ error: ERROR_STRINGS.IncorrectPassword });
            return;
        }

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

        // Verify the refresh token
        jwt.verify(refreshToken, SECRET_KEY, async (err: any, decoded: any) => {
            if (err) {
                res.status(401).json({ error: ERROR_STRINGS.InvalidToken });
                return;
            }

            // Check if the user still exists
            const user = await User.findById(decoded.id);
            if (!user) {
                res.status(404).json({ error: ERROR_STRINGS.UserNotFound });
                return;
            }

            // Issue a new access token
            const accessToken = jwt.sign(
                { id: user._id, username: user.username },
                SECRET_KEY,
                { expiresIn: '2h' }
            );

            res.status(200).json({ message: SUCCESS_STRINGS.TokenRefreshed, accessToken });
        });
    } catch (error) {
        next(error);
    }
};
