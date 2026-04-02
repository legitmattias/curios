CREATE TABLE "experience" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company" varchar(256) NOT NULL,
	"role" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"tech" text[] NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"title" varchar(256) NOT NULL,
	"bio" text NOT NULL,
	"location" varchar(128) NOT NULL,
	"email" varchar(256) NOT NULL,
	"github" varchar(512) NOT NULL,
	"linkedin" varchar(512),
	"website" varchar(512)
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"category" varchar(64) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
