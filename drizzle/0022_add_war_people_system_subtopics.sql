INSERT INTO "topics" ("code", "title", "parent_id", "is_system")
SELECT v.code, v.title, parent.id, true
FROM (
    VALUES
        ('war-home-front-workers', 'Труженики тыла', 'war'),
        ('war-prisoners', 'Побывавшие в плену', 'war')
) AS v(code, title, parent_code)
JOIN "topics" parent ON parent."code" = v.parent_code
ON CONFLICT ("code") DO UPDATE
SET "parent_id" = EXCLUDED."parent_id",
    "is_system" = true;
