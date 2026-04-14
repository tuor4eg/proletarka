INSERT INTO "sources" ("label", "url")
SELECT DISTINCT
	CASE
		WHEN "source_url" ~* '^https?://' THEN regexp_replace("source_url", '^https?://([^/?#]+).*$'::text, '\1')
		ELSE "source_url"
	END AS "label",
	"source_url" AS "url"
FROM "materials"
WHERE "source_url" IS NOT NULL
  AND btrim("source_url") <> '';
--> statement-breakpoint
INSERT INTO "material_sources" ("material_id", "source_id")
SELECT
	"m"."id" AS "material_id",
	"s"."id" AS "source_id"
FROM "materials" "m"
INNER JOIN "sources" "s" ON "s"."url" = "m"."source_url"
WHERE "m"."source_url" IS NOT NULL
  AND btrim("m"."source_url") <> ''
ON CONFLICT DO NOTHING;
