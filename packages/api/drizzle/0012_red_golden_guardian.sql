CREATE TABLE "sync_state" (
	"operation" varchar(64) PRIMARY KEY NOT NULL,
	"last_run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_duration_ms" integer,
	"last_status" varchar(16) NOT NULL,
	"last_result" jsonb,
	"last_error" text
);
