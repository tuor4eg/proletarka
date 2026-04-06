CREATE TYPE "public"."admin_action" AS ENUM('create', 'update', 'delete', 'publish', 'unpublish');--> statement-breakpoint
CREATE TYPE "public"."admin_entity_type" AS ENUM('person', 'artifact', 'artifactSection', 'material', 'topic');--> statement-breakpoint
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
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;