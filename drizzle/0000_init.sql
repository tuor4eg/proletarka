-- clean slate
DROP TABLE IF EXISTS "materials";
DROP TABLE IF EXISTS "topics";
DROP TABLE IF EXISTS "users";
DROP TYPE IF EXISTS "public"."status";
DROP TYPE IF EXISTS "public"."theme";
DROP TYPE IF EXISTS "public"."role";

-- types
CREATE TYPE "public"."status" AS ENUM('draft', 'published');
CREATE TYPE "public"."role" AS ENUM('admin');

-- users
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password" text NOT NULL,
	"role" "role" DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- tables
CREATE TABLE "topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "topics_code_unique" UNIQUE("code")
);

CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"content" text,
	"topic_id" integer NOT NULL,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"year_from" integer,
	"year_to" integer,
	"cover_image_path" text,
	"source_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "materials_code_unique" UNIQUE("code"),
	CONSTRAINT "materials_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "topics"("id")
);

-- seed: topics
INSERT INTO "topics" ("code", "label") VALUES
  ('people',        'Люди'),
  ('war',           'Война'),
  ('documents',     'Документы'),
  ('photos',        'Фото'),
  ('factory_today', 'Завод сегодня');

-- seed: materials
INSERT INTO "materials" ("code", "title", "summary", "content", "topic_id", "status", "year_from", "year_to") VALUES
  (
    'evdokimov-nikolay',
    'Евдокимов Николай Петрович',
    'Токарь высшего разряда, проработал на заводе 38 лет. Ветеран труда.',
    'Николай Петрович пришёл на завод в 1961 году сразу после армии. За три с лишним десятилетия он обучил более сорока учеников.',
    (SELECT id FROM topics WHERE code = 'people'),
    'published',
    1961,
    1999
  ),
  (
    'workshop-1943',
    'Цех № 3 в годы войны',
    'В 1943 году цех перешёл на выпуск военной продукции. Работали в три смены.',
    'С началом перестройки производства рабочие цеха № 3 освоили новую номенклатуру изделий за несколько недель. Документы об этом периоде частично сохранились в заводском архиве.',
    (SELECT id FROM topics WHERE code = 'war'),
    'published',
    1943,
    1945
  );
