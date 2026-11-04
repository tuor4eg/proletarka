CREATE TYPE "public"."admin_action" AS ENUM('create', 'update', 'delete', 'publish', 'unpublish');--> statement-breakpoint
CREATE TYPE "public"."admin_entity_type" AS ENUM('person', 'artifact', 'artifactSection', 'material', 'topic');--> statement-breakpoint
CREATE TYPE "public"."artifact_type" AS ENUM('general', 'stand', 'rarity', 'fund');--> statement-breakpoint
CREATE TYPE "public"."comment_status" AS ENUM('pending', 'approved', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('person', 'artifact');--> statement-breakpoint
CREATE TYPE "public"."material_type" AS ENUM('article', 'news', 'photo', 'group_photo', 'document');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "admin_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" "admin_action" NOT NULL,
	"entity_type" "admin_entity_type" NOT NULL,
	"entity_id" integer,
	"entity_title" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artifact_materials" (
	"artifact_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"section_id" integer,
	"position" integer,
	CONSTRAINT "artifact_materials_artifact_id_material_id_pk" PRIMARY KEY("artifact_id","material_id")
);
--> statement-breakpoint
CREATE TABLE "artifact_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"artifact_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artifacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"years_label" text,
	"year_from" integer,
	"year_to" integer,
	"artifact_type" "artifact_type" DEFAULT 'general' NOT NULL,
	"cover_image_path" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artifacts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_id" integer NOT NULL,
	"status" "comment_status" DEFAULT 'pending' NOT NULL,
	"author" text,
	"body" text NOT NULL,
	"ip_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"moderated_at" timestamp,
	"moderated_by" integer
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "entity_type" NOT NULL,
	"person_id" integer,
	"artifact_id" integer,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "entities_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "entity_topics" (
	"entity_id" integer NOT NULL,
	"topic_id" integer NOT NULL,
	CONSTRAINT "entity_topics_entity_id_topic_id_pk" PRIMARY KEY("entity_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "event_topics" (
	"event_id" integer NOT NULL,
	"topic_id" integer NOT NULL,
	CONSTRAINT "event_topics_event_id_topic_id_pk" PRIMARY KEY("event_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"entity_id" integer NOT NULL,
	"text" text NOT NULL,
	"year_from" integer,
	"year_to" integer,
	"years_label" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "events_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "material_sources" (
	"material_id" integer NOT NULL,
	"source_id" integer NOT NULL,
	CONSTRAINT "material_sources_material_id_source_id_pk" PRIMARY KEY("material_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "material_topics" (
	"material_id" integer NOT NULL,
	"topic_id" integer NOT NULL,
	CONSTRAINT "material_topics_material_id_topic_id_pk" PRIMARY KEY("material_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"content" text,
	"material_type" "material_type" DEFAULT 'article' NOT NULL,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"entity_id" integer,
	"section_id" integer,
	"year_from" integer,
	"year_to" integer,
	"cover_image_path" text,
	"position" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "materials_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"short_bio" text,
	"birth_year" integer,
	"death_year" integer,
	"years_label" text,
	"main_photo_path" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "people_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "person_materials" (
	"person_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	CONSTRAINT "person_materials_person_id_material_id_pk" PRIMARY KEY("person_id","material_id")
);
--> statement-breakpoint
CREATE TABLE "person_sources" (
	"person_id" integer NOT NULL,
	"source_id" integer NOT NULL,
	CONSTRAINT "person_sources_person_id_source_id_pk" PRIMARY KEY("person_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "showcases" (
	"section_code" text PRIMARY KEY NOT NULL,
	"artifact_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"parent_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "topics_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password" text NOT NULL,
	"role" "role" DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_materials" ADD CONSTRAINT "artifact_materials_artifact_id_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_materials" ADD CONSTRAINT "artifact_materials_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_materials" ADD CONSTRAINT "artifact_materials_section_id_artifact_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."artifact_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_sections" ADD CONSTRAINT "artifact_sections_artifact_id_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_artifact_id_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_topics" ADD CONSTRAINT "entity_topics_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_topics" ADD CONSTRAINT "entity_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_topics" ADD CONSTRAINT "event_topics_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_topics" ADD CONSTRAINT "event_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_sources" ADD CONSTRAINT "material_sources_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_sources" ADD CONSTRAINT "material_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_topics" ADD CONSTRAINT "material_topics_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_topics" ADD CONSTRAINT "material_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_section_id_artifact_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."artifact_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_materials" ADD CONSTRAINT "person_materials_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_materials" ADD CONSTRAINT "person_materials_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_sources" ADD CONSTRAINT "person_sources_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_sources" ADD CONSTRAINT "person_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcases" ADD CONSTRAINT "showcases_artifact_id_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_parent_id_topics_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "artifact_materials_material_id_idx" ON "artifact_materials" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "artifact_sections_artifact_id_position_idx" ON "artifact_sections" USING btree ("artifact_id","position");--> statement-breakpoint
CREATE INDEX "comments_status_created_at_idx" ON "comments" USING btree ("status","created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "comments_entity_id_created_at_idx" ON "comments" USING btree ("entity_id","created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "entities_person_id_idx" ON "entities" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "entities_artifact_id_idx" ON "entities" USING btree ("artifact_id");--> statement-breakpoint
CREATE INDEX "entity_topics_topic_id_idx" ON "entity_topics" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "event_topics_topic_id_idx" ON "event_topics" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "events_entity_id_year_from_id_idx" ON "events" USING btree ("entity_id","year_from","id");--> statement-breakpoint
CREATE INDEX "material_topics_topic_id_idx" ON "material_topics" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "materials_entity_id_created_at_idx" ON "materials" USING btree ("entity_id","created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "materials_entity_id_status_position_id_idx" ON "materials" USING btree ("entity_id","status","position","id");--> statement-breakpoint
CREATE INDEX "materials_type_status_created_at_idx" ON "materials" USING btree ("material_type","status","created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "person_materials_material_id_idx" ON "person_materials" USING btree ("material_id");
--> statement-breakpoint
INSERT INTO "topics" ("code", "title", "is_system")
VALUES
    ('war', 'Война', true),
    ('factory', 'Завод', true),
    ('civil-war', 'Гражданская война', true);
--> statement-breakpoint
INSERT INTO "topics" ("code", "title", "parent_id", "is_system")
SELECT child.code, child.title, parent.id, true
FROM (VALUES
    ('war-mobilization', 'Мобилизация', 'war'),
    ('war-demobilization', 'Демобилизация', 'war'),
    ('war-killed', 'Погиб', 'war'),
    ('factory-hired', 'Прием', 'factory'),
    ('factory-dismissed', 'Увольнение', 'factory'),
    ('war-home-front-workers', 'Труженики тыла', 'war'),
    ('war-prisoners', 'Побывавшие в плену', 'war'),
    ('war-234-division', '234 дивизия', 'war'),
    ('war-partisans', 'Партизаны', 'war')
) AS child(code, title, parent_code)
JOIN "topics" parent ON parent.code = child.parent_code;
