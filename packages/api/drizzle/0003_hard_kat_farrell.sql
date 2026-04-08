CREATE TABLE "translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" uuid NOT NULL,
	"locale" varchar(8) NOT NULL,
	"field" varchar(64) NOT NULL,
	"value" text NOT NULL,
	"translated_by" varchar(16) NOT NULL,
	"translated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "translations_unique" UNIQUE("entity_type","entity_id","locale","field")
);
