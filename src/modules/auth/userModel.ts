import mongoose, { Document, Schema } from "mongoose";

interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  googleId?: string;
  avatar?: string;
  authProvider: 'local' | 'google' | 'github';
}

const userSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  securityQuestion: { type: String },
  securityAnswer: { type: String },
  googleId: { type: String, sparse: true, unique: true },
  avatar: { type: String },
  authProvider: { type: String, enum: ['local', 'google', 'github'], default: 'local' },
}, { timestamps: true });

const User = mongoose.model<IUser>('users', userSchema);
export default User;