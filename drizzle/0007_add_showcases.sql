CREATE TABLE "showcases" (
	"section_code" text PRIMARY KEY NOT NULL,
	"artifact_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "showcases" ADD CONSTRAINT "showcases_artifact_id_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE cascade ON UPDATE no action;