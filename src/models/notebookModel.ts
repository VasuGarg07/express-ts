import mongoose, { Document, Schema, Types } from "mongoose";

// ================== Author ==================
export interface IAuthor extends Document {
    userId: Types.ObjectId;
    name: string;
    avatar: string; // compressed base64 or external URL
}

const authorSchema: Schema = new Schema<IAuthor>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "users",
            unique: true,
        },
        name: {
            type: String,
            required: true,
            default: "Anonymous",
        },
        avatar: {
            type: String,
            required: true,
            default:
                "https://api.dicebear.com/6.x/initials/svg?seed=Archivra", // or a base64 fallback
        },
    },
    {
        toJSON: {
            transform: (_, ret) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// ================== Notebook ==================
export interface INotebook extends Document {
    userId: Types.ObjectId;
    title: string;
    coverImageUrl?: string;
    visibility: "public" | "private";
    passwordHash?: string; // only if private
}

const notebookSchema: Schema = new Schema<INotebook>(
    {
        userId: { type: Schema.Types.ObjectId, required: true, ref: "users" },
        title: { type: String, required: true },
        coverImageUrl: { type: String },
        visibility: { type: String, enum: ["public", "private"], default: "private" },
        passwordHash: { type: String }, // stored if visibility === "private"
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_, ret) => {
                ret.id = ret._id;
                ret.createdAt = ret.createdAt?.getTime();
                ret.updatedAt = ret.updatedAt?.getTime();
                delete ret._id;
                delete ret.__v;
                delete ret.passwordHash; // never expose
            },
        },
    }
);

// ================== Chapter ==================
export interface IChapter extends Document {
    notebookId: Types.ObjectId;
    title: string;
    content: string;
    order: number;
}

const chapterSchema: Schema = new Schema<IChapter>(
    {
        notebookId: { type: Schema.Types.ObjectId, required: true, ref: "notebooks" },
        title: { type: String, required: true },
        content: { type: String, default: "" },
        order: { type: Number, default: 0 },
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
            },
        },
    }
);

// ================== Bookmarks ==================
export interface IBookmark extends Document {
    userId: Types.ObjectId;
    notebookId: Types.ObjectId;
}

const bookmarkSchema = new Schema<IBookmark>(
    {
        userId: { type: Schema.Types.ObjectId, required: true, ref: "users" },
        notebookId: { type: Schema.Types.ObjectId, required: true, ref: "notebooks" },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        toJSON: {
            transform: (_, ret) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
            },
        },
    }
);

bookmarkSchema.index({ userId: 1, notebookId: 1 }, { unique: true });

export const Author = mongoose.model<IAuthor>("authors", authorSchema);
export const Notebook = mongoose.model<INotebook>("notebooks", notebookSchema);
export const Chapter = mongoose.model<IChapter>("chapters", chapterSchema);
export const Bookmark = mongoose.model<IBookmark>("bookmarks", bookmarkSchema);