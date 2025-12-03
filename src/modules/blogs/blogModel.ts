// blog.model.ts
import mongoose, { Document, Schema, Types } from "mongoose";
import { handleDocTransform } from "../../utils/utilities";

interface IBlog extends Document {
    userId: Types.ObjectId;
    notebookId: Types.ObjectId;
    author: string;
    title: string;
    blogContent: string;
    tags: string[];
    isArchived: boolean;
}

const blogSchema = new Schema<IBlog>(
    {
        userId: { type: Schema.Types.ObjectId, required: true, ref: "users" },
        notebookId: { type: Schema.Types.ObjectId, required: true, ref: "notebooks" },
        author: { type: String, required: true },
        title: { type: String, required: true, unique: true },
        blogContent: { type: String, required: true },
        tags: { type: [String], default: [] },
        isArchived: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        toJSON: { transform: handleDocTransform },
    }
);

const Blog = mongoose.model<IBlog>('blogs', blogSchema);
export default Blog;