ALTER TYPE "public"."entity_type" ADD VALUE 'artifact';--> statement-breakpoint
CREATE TABLE "artifacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"years_label" text,
	"cover_image_path" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artifacts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN "artifact_id" integer;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "position" integer;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_artifact_id_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE cascade ON UPDATE no action;