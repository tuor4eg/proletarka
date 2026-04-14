CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "person_sources" (
	"person_id" integer NOT NULL,
	"source_id" integer NOT NULL,
	CONSTRAINT "person_sources_person_id_source_id_pk" PRIMARY KEY("person_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "material_sources" (
	"material_id" integer NOT NULL,
	"source_id" integer NOT NULL,
	CONSTRAINT "material_sources_material_id_source_id_pk" PRIMARY KEY("material_id","source_id")
);
--> statement-breakpoint
ALTER TABLE "person_sources" ADD CONSTRAINT "person_sources_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_sources" ADD CONSTRAINT "person_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_sources" ADD CONSTRAINT "material_sources_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_sources" ADD CONSTRAINT "material_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;
