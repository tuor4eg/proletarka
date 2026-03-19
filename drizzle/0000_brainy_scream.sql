CREATE TYPE "public"."status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('people', 'war', 'documents', 'photos', 'factory_today');--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"content" text,
	"theme" "theme" NOT NULL,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"year_from" integer,
	"year_to" integer,
	"cover_image_path" text,
	"source_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "materials_code_unique" UNIQUE("code")
);
