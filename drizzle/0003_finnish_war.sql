INSERT INTO "topics" ("code", "title", "parent_id", "is_system")
VALUES ('finnish-war', 'Финская война', NULL, true)
ON CONFLICT ("code") DO UPDATE
SET "title" = EXCLUDED."title",
    "parent_id" = EXCLUDED."parent_id",
    "is_system" = true;
