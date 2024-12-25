import mongoose, { Document, Schema } from "mongoose";

export interface IExpense extends Document {
    title: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    date: number; // unix timestamp
    description?: string;
    userId: mongoose.Types.ObjectId;
}

const expenseSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        amount: { type: Number, required: true },
        type: { type: String, required: true },
        category: { type: String, required: true },
        date: { type: Number, required: true },
        description: { type: String },
        userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "users" },
    },
    {
        toJSON: {
            transform: (_, ret) => {
                ret.id = ret._id;
                ret.date = ret.date * 1000;
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);
const Expense = mongoose.model<IExpense>('expenses', expenseSchema);

export default Expense;