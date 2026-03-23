-- types
DO $$ BEGIN
  CREATE TYPE "public"."role" AS ENUM('admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."status" AS ENUM('draft', 'published');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."entity_type" AS ENUM('person');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."material_type" AS ENUM('article', 'photo', 'document');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- users
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password" text NOT NULL,
	"role" "role" DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- topics
CREATE TABLE IF NOT EXISTS "topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "topics_code_unique" UNIQUE("code")
);

-- people
CREATE TABLE IF NOT EXISTS "people" (
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

-- entities
CREATE TABLE IF NOT EXISTS "entities" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "entity_type" NOT NULL,
	"person_id" integer REFERENCES "people"("id"),
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "entities_code_unique" UNIQUE("code")
);

-- materials
CREATE TABLE IF NOT EXISTS "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"content" text,
	"material_type" "material_type" DEFAULT 'article' NOT NULL,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"entity_id" integer REFERENCES "entities"("id"),
	"year_from" integer,
	"year_to" integer,
	"cover_image_path" text,
	"source_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "materials_code_unique" UNIQUE("code")
);

-- material_topics
CREATE TABLE IF NOT EXISTS "material_topics" (
	"material_id" integer NOT NULL REFERENCES "materials"("id"),
	"topic_id" integer NOT NULL REFERENCES "topics"("id"),
	PRIMARY KEY ("material_id", "topic_id")
);

-- seed: topics
INSERT INTO "topics" ("code", "title") VALUES
  ('people',        'Люди'),
  ('war',           'Война'),
  ('documents',     'Документы'),
  ('photos',        'Фото'),
  ('factory-today', 'Завод сегодня')
ON CONFLICT (code) DO NOTHING;

-- seed: people
INSERT INTO "people" ("code", "name", "short_bio", "birth_year", "death_year", "years_label") VALUES
  (
    'evdokimov-nikolay',
    'Евдокимов Николай Петрович',
    'Токарь высшего разряда, ветеран труда. Проработал на заводе 38 лет, обучил более сорока учеников.',
    1923,
    2001,
    NULL
  ),
  (
    'sinitsyna-mariya',
    'Синицына Мария Ивановна',
    'Начальник планово-экономического отдела. Пришла на завод в 1955 году, вышла на пенсию в 1987-м.',
    NULL,
    NULL,
    'не позднее 1935 — после 1990'
  )
ON CONFLICT (code) DO NOTHING;

-- seed: entities
INSERT INTO "entities" ("type", "person_id", "code")
SELECT 'person', (SELECT id FROM people WHERE code = 'evdokimov-nikolay'), 'entity-evdokimov-nikolay'
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE code = 'entity-evdokimov-nikolay');

INSERT INTO "entities" ("type", "person_id", "code")
SELECT 'person', (SELECT id FROM people WHERE code = 'sinitsyna-mariya'), 'entity-sinitsyna-mariya'
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE code = 'entity-sinitsyna-mariya');

-- seed: materials
INSERT INTO "materials" ("code", "title", "summary", "content", "material_type", "status", "entity_id", "year_from", "year_to") VALUES
  (
    'evdokimov-vospominaniya',
    'Воспоминания о Николае Евдокимове',
    'Коллеги вспоминают токаря, который учил всех работать с душой.',
    'Николай Петрович пришёл на завод в 1941 году, сразу после школы. Говорил, что станок для него — как музыкальный инструмент: нужно чувствовать материал. За три с лишним десятилетия он обучил более сорока учеников, многие из которых стали мастерами своего цеха.',
    'article',
    'published',
    (SELECT id FROM entities WHERE code = 'entity-evdokimov-nikolay'),
    1941,
    1979
  ),
  (
    'evdokimov-photo-1965',
    'Евдокимов у станка, 1965 год',
    'Фотография из заводского архива.',
    NULL,
    'photo',
    'published',
    (SELECT id FROM entities WHERE code = 'entity-evdokimov-nikolay'),
    1965,
    NULL
  ),
  (
    'sinitsyna-plan-1960',
    'Как Синицына спасла план 1960 года',
    'История о том, как плановый отдел под руководством Марии Ивановны не дал заводу сорвать квартальный план.',
    'В марте 1960 года поставки металла задержались на две недели. Мария Ивановна за трое суток пересчитала весь производственный план, перераспределила мощности между цехами и нашла резервы, о которых никто не знал. Завод выполнил план в срок.',
    'article',
    'published',
    (SELECT id FROM entities WHERE code = 'entity-sinitsyna-mariya'),
    1960,
    NULL
  ),
  (
    'ceh3-vojna',
    'Цех № 3 в годы войны',
    'В 1943 году цех перешёл на выпуск военной продукции. Работали в три смены.',
    'С началом перестройки производства рабочие цеха № 3 освоили новую номенклатуру изделий за несколько недель. Документы об этом периоде частично сохранились в заводском архиве.',
    'article',
    'published',
    NULL,
    1943,
    1945
  )
ON CONFLICT (code) DO NOTHING;

-- seed: material_topics
INSERT INTO "material_topics" ("material_id", "topic_id")
SELECT m.id, t.id FROM materials m, topics t
WHERE m.code = 'evdokimov-vospominaniya' AND t.code = 'people'
ON CONFLICT DO NOTHING;

INSERT INTO "material_topics" ("material_id", "topic_id")
SELECT m.id, t.id FROM materials m, topics t
WHERE m.code = 'evdokimov-photo-1965' AND t.code = 'people'
ON CONFLICT DO NOTHING;

INSERT INTO "material_topics" ("material_id", "topic_id")
SELECT m.id, t.id FROM materials m, topics t
WHERE m.code = 'evdokimov-photo-1965' AND t.code = 'photos'
ON CONFLICT DO NOTHING;

INSERT INTO "material_topics" ("material_id", "topic_id")
SELECT m.id, t.id FROM materials m, topics t
WHERE m.code = 'sinitsyna-plan-1960' AND t.code = 'people'
ON CONFLICT DO NOTHING;

INSERT INTO "material_topics" ("material_id", "topic_id")
SELECT m.id, t.id FROM materials m, topics t
WHERE m.code = 'ceh3-vojna' AND t.code = 'war'
ON CONFLICT DO NOTHING;
