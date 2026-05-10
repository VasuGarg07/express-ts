import { sql } from 'drizzle-orm';
import { pgTable, serial, varchar, text, numeric, bigint, check } from 'drizzle-orm/pg-core';

export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 24 }).notNull(),
  title: text('title').notNull(),
  amount: numeric('amount', { mode: 'number' }).notNull(),
  type: text('type').notNull(),
  category: text('category').notNull(),
  date: bigint('date', { mode: 'number' }),
  description: text('description'),
}, (table) => [
  check('amount_positive', sql`${table.amount} > 0`),
  check('type_valid', sql`${table.type} IN ('income', 'expense')`),
]);
