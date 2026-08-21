CREATE TABLE "canonical_jobs" (
	"run_id" text NOT NULL,
	"company_id" text NOT NULL,
	"job_id" text NOT NULL,
	"title" text NOT NULL,
	"location" text NOT NULL,
	"workplace_type" text NOT NULL,
	"department" text,
	"employment_type" text,
	"published_at" text,
	"experience_text" text,
	"description" text,
	"company_job_url" text NOT NULL,
	"apply_url" text,
	"source_catalog_url" text NOT NULL,
	"collector_id" text NOT NULL,
	"collected_at" timestamp with time zone NOT NULL,
	"source_location" text,
	CONSTRAINT "canonical_jobs_run_id_company_id_job_id_pk" PRIMARY KEY("run_id","company_id","job_id")
);
--> statement-breakpoint
CREATE TABLE "collector_runs" (
	"run_id" text PRIMARY KEY NOT NULL,
	"collector_id" text NOT NULL,
	"company_id" text NOT NULL,
	"source_catalog_url" text NOT NULL,
	"snapshot_id" text NOT NULL,
	"status" text NOT NULL,
	"row_count" integer NOT NULL,
	"valid_row_count" integer NOT NULL,
	"error_row_count" integer NOT NULL,
	"health_summary" jsonb,
	"errors" jsonb,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_incidents" (
	"incident_id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"collector_id" text NOT NULL,
	"snapshot_id" text NOT NULL,
	"status" text NOT NULL,
	"reasons" jsonb NOT NULL,
	"evidence" jsonb,
	"heal_prompt" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "canonical_jobs" ADD CONSTRAINT "canonical_jobs_run_id_collector_runs_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."collector_runs"("run_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_incidents" ADD CONSTRAINT "health_incidents_run_id_collector_runs_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."collector_runs"("run_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "canonical_jobs_run_idx" ON "canonical_jobs" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "canonical_jobs_company_job_idx" ON "canonical_jobs" USING btree ("company_id","job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collector_runs_snapshot_id_unique" ON "collector_runs" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "collector_runs_collector_created_idx" ON "collector_runs" USING btree ("collector_id","created_at");--> statement-breakpoint
CREATE INDEX "collector_runs_collector_status_idx" ON "collector_runs" USING btree ("collector_id","status");--> statement-breakpoint
CREATE INDEX "health_incidents_collector_created_idx" ON "health_incidents" USING btree ("collector_id","created_at");--> statement-breakpoint
CREATE INDEX "health_incidents_run_idx" ON "health_incidents" USING btree ("run_id");