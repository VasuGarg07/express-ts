// notebook.model.ts
import mongoose, { Document, Schema, Types } from "mongoose";
import { handleDocTransform } from "../../utils/utilities";

interface INotebook extends Document {
    userId: Types.ObjectId;
    author: string;
    title: string;
    description?: string;
    coverImageUrl: string;
    isPublic: boolean;
}

const notebookSchema = new Schema<INotebook>(
    {
        userId: { type: Schema.Types.ObjectId, required: true, ref: "users" },
        author: { type: String, required: true },
        title: { type: String, required: true, unique: true },
        description: { type: String, maxlength: 500 },
        coverImageUrl: { type: String, required: true },
        isPublic: { type: Boolean, default: true },
    },
    {
        timestamps: true,
        toJSON: { transform: handleDocTransform },
    }
);

const Notebook = mongoose.model<INotebook>('notebooks', notebookSchema);
export default Notebook;