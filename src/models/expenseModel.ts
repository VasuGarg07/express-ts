import mongoose, { Document, Schema } from "mongoose";

export interface IExpense extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    date: number; // unix timestamp
    description?: string;
}

const expenseSchema: Schema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "users" },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, required: true },
    category: { type: String, required: true },
    date: { type: Number, required: true },
    description: { type: String }
})
const Expense = mongoose.model<IExpense>('expenses', expenseSchema);

export default Expense;