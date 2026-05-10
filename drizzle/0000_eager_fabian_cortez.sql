CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(24) NOT NULL,
	"title" text NOT NULL,
	"amount" numeric NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"date" bigint,
	"description" text,
	CONSTRAINT "amount_positive" CHECK ("expenses"."amount" > 0),
	CONSTRAINT "type_valid" CHECK ("expenses"."type" IN ('income', 'expense'))
);
