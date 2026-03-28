CREATE TABLE "artifact_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"artifact_id" integer NOT NULL,
	"title" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "section_id" integer;
--> statement-breakpoint
ALTER TABLE "artifact_sections" ADD CONSTRAINT "artifact_sections_artifact_id_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_section_id_artifact_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."artifact_sections"("id") ON DELETE set null ON UPDATE no action;
