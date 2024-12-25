import mongoose, { Document, Schema } from "mongoose";

interface IBlog extends Document {
    author: string;
    title: string;
    coverImageUrl: string;
    blogContent: string;
    tags: string[];
    isArchived: boolean;
    userId: mongoose.Types.ObjectId;
}

const blogSchema: Schema = new Schema(
    {
        author: { type: String, required: true },
        title: { type: String, required: true, unique: true },
        coverImageUrl: { type: String, required: true },
        blogContent: { type: String, required: true },
        tags: { type: [String], default: [] },
        isArchived: { type: Boolean, default: false },
        userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "users" },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_, ret) => {
                ret.id = ret._id;
                ret.createdAt = ret.createdAt.getTime();
                ret.updatedAt = ret.updatedAt.getTime();
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

const Blog = mongoose.model<IBlog>('blogs', blogSchema);
export default Blog;