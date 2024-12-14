import mongoose, { Document, Schema } from "mongoose";


export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    securityQuestion: string;
    securityAnswer: string;
}

const userSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    securityQuestion: { type: String, required: true },
    securityAnswer: { type: String, required: true },
},
    { timestamps: true }
);

const User = mongoose.model<IUser>('users', userSchema);
export default User;