CREATE TABLE "now_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dossier_id" varchar(64) NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"priority" varchar(16) NOT NULL,
	"progress" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"content_hash" varchar(64),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "now_goals_dossier_id_unique" UNIQUE("dossier_id")
);
