ALTER TABLE "topics"
ADD COLUMN "is_system" boolean NOT NULL DEFAULT false;
--> statement-breakpoint

UPDATE "topics"
SET "is_system" = true,
    "parent_id" = NULL
WHERE "code" IN ('war', 'factory');
--> statement-breakpoint

INSERT INTO "topics" ("code", "title", "is_system")
VALUES
    ('war', 'Война', true),
    ('factory', 'Завод', true)
ON CONFLICT ("code") DO UPDATE
SET "is_system" = true,
    "parent_id" = NULL;
--> statement-breakpoint

INSERT INTO "topics" ("code", "title", "parent_id", "is_system")
SELECT v.code, v.title, parent.id, true
FROM (
    VALUES
        ('war-mobilization', 'Мобилизация', 'war'),
        ('war-demobilization', 'Демобилизация', 'war'),
        ('war-killed', 'Погиб', 'war'),
        ('factory-hired', 'Прием', 'factory'),
        ('factory-dismissed', 'Увольнение', 'factory')
) AS v(code, title, parent_code)
JOIN "topics" parent ON parent."code" = v.parent_code
ON CONFLICT ("code") DO UPDATE
SET "parent_id" = EXCLUDED."parent_id",
    "is_system" = true;
