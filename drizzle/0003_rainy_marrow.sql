CREATE TYPE "public"."artifact_type" AS ENUM('general', 'stand');--> statement-breakpoint
ALTER TABLE "artifacts" ADD COLUMN "artifact_type" "artifact_type" DEFAULT 'general' NOT NULL;