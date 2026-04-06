CREATE TABLE "education" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution" varchar(256) NOT NULL,
	"degree" varchar(256) NOT NULL,
	"field" varchar(256) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
