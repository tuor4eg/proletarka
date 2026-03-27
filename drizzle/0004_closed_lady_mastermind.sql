CREATE TABLE "entity_topics" (
	"entity_id" integer NOT NULL,
	"topic_id" integer NOT NULL,
	CONSTRAINT "entity_topics_entity_id_topic_id_pk" PRIMARY KEY("entity_id","topic_id")
);
--> statement-breakpoint
ALTER TABLE "entity_topics" ADD CONSTRAINT "entity_topics_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_topics" ADD CONSTRAINT "entity_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;