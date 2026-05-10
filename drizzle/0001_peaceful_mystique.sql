CREATE TABLE "applicants" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(24) NOT NULL,
	"full_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"phone_number" text NOT NULL,
	"photo_url" text,
	"profile_summary" text,
	"resume_url" text NOT NULL,
	"skills" text[] NOT NULL,
	"languages" text[] NOT NULL,
	"experience" jsonb,
	"education" jsonb,
	"preference" jsonb NOT NULL,
	"social_links" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "applicants_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "employers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(24) NOT NULL,
	"company_name" text NOT NULL,
	"logo_url" text NOT NULL,
	"industry" text NOT NULL,
	"address" text NOT NULL,
	"website_url" text,
	"employee_strength" text NOT NULL,
	"year_of_establishment" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_number" text NOT NULL,
	"company_overview" text,
	"company_vision" text,
	"social_links" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employers_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "employers_contact_email_unique" UNIQUE("contact_email"),
	CONSTRAINT "employers_contact_number_unique" UNIQUE("contact_number")
);
--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"applicant_id" integer NOT NULL,
	"cover_letter" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_applicant_unique" UNIQUE("job_id","applicant_id"),
	CONSTRAINT "application_status_valid" CHECK ("job_applications"."status" IN ('pending', 'shortlisted', 'rejected', 'contacted', 'hired'))
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"posted_by" integer NOT NULL,
	"title" text NOT NULL,
	"location" text NOT NULL,
	"job_level" text NOT NULL,
	"vacancies" integer DEFAULT 1 NOT NULL,
	"employment_type" text NOT NULL,
	"shift_type" text NOT NULL,
	"salary_range" text NOT NULL,
	"experience_required" text NOT NULL,
	"description" text NOT NULL,
	"requirements" text[] NOT NULL,
	"responsibilities" text[],
	"benefits" text[],
	"skills_required" text[] NOT NULL,
	"tags" text[],
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_level_valid" CHECK ("jobs"."job_level" IN ('internship', 'entry-level', 'mid-level', 'senior-level', 'lead', 'manager')),
	CONSTRAINT "employment_type_valid" CHECK ("jobs"."employment_type" IN ('full-time', 'part-time', 'contractual', 'freelance', 'internship')),
	CONSTRAINT "shift_type_valid" CHECK ("jobs"."shift_type" IN ('day', 'night', 'flexible'))
);
--> statement-breakpoint
CREATE TABLE "saved_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"applicant_id" integer NOT NULL,
	"job_id" integer NOT NULL,
	"saved_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_job_unique" UNIQUE("applicant_id","job_id")
);
--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_posted_by_employers_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."employers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;