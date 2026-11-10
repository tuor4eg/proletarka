INSERT INTO "topics" ("code", "title", "parent_id", "is_system")
SELECT 'war-missing', 'Пропал без вести', parent.id, true
FROM "topics" parent
WHERE parent.code = 'war'
ON CONFLICT ("code") DO UPDATE
SET "title" = EXCLUDED."title",
    "parent_id" = EXCLUDED."parent_id",
    "is_system" = true;
