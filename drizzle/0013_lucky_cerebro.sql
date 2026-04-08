CREATE TYPE "public"."comment_status" AS ENUM('pending', 'approved', 'hidden');--> statement-breakpoint
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
ALTER TABLE "comments" ADD CONSTRAINT "comments_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;