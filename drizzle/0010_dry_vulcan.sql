CREATE TABLE "artifact_materials" (
	"artifact_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"section_id" integer,
	"position" integer,
	CONSTRAINT "artifact_materials_artifact_id_material_id_pk" PRIMARY KEY("artifact_id","material_id")
);
--> statement-breakpoint
ALTER TABLE "artifact_materials" ADD CONSTRAINT "artifact_materials_artifact_id_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_materials" ADD CONSTRAINT "artifact_materials_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_materials" ADD CONSTRAINT "artifact_materials_section_id_artifact_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."artifact_sections"("id") ON DELETE set null ON UPDATE no action;