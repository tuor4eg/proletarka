ALTER TYPE "public"."material_type" ADD VALUE IF NOT EXISTS 'group_photo';--> statement-breakpoint
CREATE TABLE "person_materials" (
	"person_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	CONSTRAINT "person_materials_person_id_material_id_pk" PRIMARY KEY("person_id","material_id")
);
--> statement-breakpoint
ALTER TABLE "person_materials" ADD CONSTRAINT "person_materials_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_materials" ADD CONSTRAINT "person_materials_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;
