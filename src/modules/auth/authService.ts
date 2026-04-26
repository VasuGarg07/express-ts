import jwt from 'jsonwebtoken';
import { compareData, hashData } from '../../utils/utilities';
import User from './userModel';
import RefreshToken from './refreshTokenModel';
import CONFIG from '../../config/config';
import { ERROR_STRINGS } from '../../utils/response.string';
import { ApiError } from '../../utils/ApiError';

const secretKey = CONFIG.SECRET_KEY;

export const generateTestToken = (id: string, username: string, email: string) => {
  const accessToken = jwt.sign({ id, username, email }, secretKey, { expiresIn: '1d' });
  return { accessToken };
};

export const registerUser = async (
  username: string,
  email: string,
  password: string,
  securityQuestion: string,
  securityAnswer: string
) => {
  const existing = await User.findOne({
    $or: [{ username }, { email: username }],
  });

  if (existing) {
    throw new ApiError(409, 'User Already Exists', { id: existing._id });
  }

  const hashedPassword = await hashData(password);
  const hashedSecurityAnswer = await hashData(securityAnswer);

  const newUser = await new User({
    username,
    email,
    securityQuestion,
    password: hashedPassword,
    securityAnswer: hashedSecurityAnswer,
  }).save();

  return { id: newUser._id };
};

export const loginUser = async (username: string, password: string) => {
  if (!username || !password) {
    throw new ApiError(400, ERROR_STRINGS.InvalidCreds);
  }

  const user = await User.findOne({ $or: [{ username }, { email: username }]});
  if (!user) {
    throw new ApiError(404, ERROR_STRINGS.InvalidCreds);
  }

  const isPasswordValid = await compareData(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, ERROR_STRINGS.InvalidCreds);
  }

  const accessToken = jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    secretKey,
    { expiresIn: '2h' }
  );
  const refreshToken = jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    secretKey,
    { expiresIn: '1d' }
  );

  await RefreshToken.create({
    token: refreshToken,
    userId: user._id,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken };
};

export const changeUserPassword = async (
  username: string,
  securityAnswer: string,
  newPassword: string
) => {
  const user = await User.findOne({
    $or: [{ username }, { email: username }],
  });
  if (!user) {
    throw new ApiError(404, ERROR_STRINGS.InvalidCreds);
  }

  const isAnswerValid = await compareData(securityAnswer, user.securityAnswer);
  if (!isAnswerValid) {
    throw new ApiError(401, ERROR_STRINGS.InvalidCreds);
  }

  user.password = await hashData(newPassword);
  await user.save();
};

export const refreshTokens = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new ApiError(400, ERROR_STRINGS.NoRefToken);
  }

  const storedToken = await RefreshToken.findOne({ token: refreshToken });
  if (!storedToken) {
    throw new ApiError(401, ERROR_STRINGS.InvalidToken);
  }

  let decoded: any;
  try {
    decoded = jwt.verify(refreshToken, secretKey);
  } catch {
    await RefreshToken.deleteOne({ token: refreshToken });
    throw new ApiError(401, ERROR_STRINGS.InvalidToken);
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(404, ERROR_STRINGS.UserNotFound);
  }

  await RefreshToken.deleteOne({ token: refreshToken });

  const newAccessToken = jwt.sign(
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

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (refreshToken: string) => {
  await RefreshToken.deleteOne({ token: refreshToken });
};