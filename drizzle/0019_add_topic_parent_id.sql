ALTER TABLE "topics"
ADD COLUMN "parent_id" integer;
--> statement-breakpoint
ALTER TABLE "topics"
ADD CONSTRAINT "topics_parent_id_topics_id_fk"
FOREIGN KEY ("parent_id") REFERENCES "public"."topics"("id")
ON DELETE set null
ON UPDATE no action;
