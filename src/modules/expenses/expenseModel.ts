import mongoose, { Document, Schema, Types } from "mongoose";

export interface IExpense extends Document {
    userId: Types.ObjectId;
    title: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    date: number; // unix timestamp
    description?: string;
}

const expenseSchema: Schema = new Schema<IExpense>(
    {
        userId: { type: Schema.Types.ObjectId, required: true, ref: "users" },
        title: { type: String, required: true },
        amount: { type: Number, required: true },
        type: { type: String, required: true },
        category: { type: String, required: true },
        date: { type: Number, required: true },
        description: { type: String },
    },
    {
        toJSON: {
            transform: (doc, ret) => {
                const { _id, __v, date, ...rest } = ret;
                return { 
                    id: _id, 
                    date: date * 1000,
                    ...rest };
            }
        },
    }
);
const Expense = mongoose.model<IExpense>('expenses', expenseSchema);

export default Expense;