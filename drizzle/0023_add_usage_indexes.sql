CREATE INDEX IF NOT EXISTS "material_topics_topic_id_idx"
ON "material_topics" ("topic_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "event_topics_topic_id_idx"
ON "event_topics" ("topic_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "entity_topics_topic_id_idx"
ON "entity_topics" ("topic_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "events_entity_id_year_from_id_idx"
ON "events" ("entity_id", "year_from", "id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "materials_entity_id_created_at_idx"
ON "materials" ("entity_id", "created_at" DESC);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "materials_entity_id_status_position_id_idx"
ON "materials" ("entity_id", "status", "position", "id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "materials_type_status_created_at_idx"
ON "materials" ("material_type", "status", "created_at" DESC);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "entities_person_id_idx"
ON "entities" ("person_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "entities_artifact_id_idx"
ON "entities" ("artifact_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "person_materials_material_id_idx"
ON "person_materials" ("material_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "artifact_materials_material_id_idx"
ON "artifact_materials" ("material_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "artifact_sections_artifact_id_position_idx"
ON "artifact_sections" ("artifact_id", "position");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "comments_status_created_at_idx"
ON "comments" ("status", "created_at" DESC);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "comments_entity_id_created_at_idx"
ON "comments" ("entity_id", "created_at" DESC);
