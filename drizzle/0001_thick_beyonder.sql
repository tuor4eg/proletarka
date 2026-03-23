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
CREATE TABLE "event_topics" (
	"event_id" integer NOT NULL,
	"topic_id" integer NOT NULL,
	CONSTRAINT "event_topics_event_id_topic_id_pk" PRIMARY KEY("event_id","topic_id")
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_topics" ADD CONSTRAINT "event_topics_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_topics" ADD CONSTRAINT "event_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
