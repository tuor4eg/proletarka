WITH topic_ids AS (
    SELECT
        MAX(CASE WHEN code = 'retired' THEN id END) AS retired_id,
        MAX(CASE WHEN code = 'factory' THEN id END) AS factory_id,
        MAX(CASE WHEN code = 'factory-dismissed' THEN id END) AS factory_dismissed_id
    FROM topics
)
INSERT INTO event_topics (event_id, topic_id)
SELECT et.event_id, topic_ids.factory_id
FROM event_topics et
CROSS JOIN topic_ids
WHERE et.topic_id = topic_ids.retired_id
  AND topic_ids.retired_id IS NOT NULL
  AND topic_ids.factory_id IS NOT NULL
ON CONFLICT DO NOTHING;
--> statement-breakpoint

WITH topic_ids AS (
    SELECT
        MAX(CASE WHEN code = 'retired' THEN id END) AS retired_id,
        MAX(CASE WHEN code = 'factory' THEN id END) AS factory_id,
        MAX(CASE WHEN code = 'factory-dismissed' THEN id END) AS factory_dismissed_id
    FROM topics
)
INSERT INTO event_topics (event_id, topic_id)
SELECT et.event_id, topic_ids.factory_dismissed_id
FROM event_topics et
CROSS JOIN topic_ids
WHERE et.topic_id = topic_ids.retired_id
  AND topic_ids.retired_id IS NOT NULL
  AND topic_ids.factory_dismissed_id IS NOT NULL
ON CONFLICT DO NOTHING;
--> statement-breakpoint

WITH topic_ids AS (
    SELECT
        MAX(CASE WHEN code = 'retired' THEN id END) AS retired_id,
        MAX(CASE WHEN code = 'factory' THEN id END) AS factory_id,
        MAX(CASE WHEN code = 'factory-dismissed' THEN id END) AS factory_dismissed_id
    FROM topics
)
DELETE FROM event_topics et
USING topic_ids
WHERE et.topic_id = topic_ids.retired_id
  AND topic_ids.retired_id IS NOT NULL
  AND topic_ids.factory_id IS NOT NULL
  AND topic_ids.factory_dismissed_id IS NOT NULL;
--> statement-breakpoint

WITH topic_ids AS (
    SELECT
        MAX(CASE WHEN code = 'retired' THEN id END) AS retired_id,
        MAX(CASE WHEN code = 'factory' THEN id END) AS factory_id,
        MAX(CASE WHEN code = 'factory-dismissed' THEN id END) AS factory_dismissed_id
    FROM topics
)
INSERT INTO material_topics (material_id, topic_id)
SELECT mt.material_id, topic_ids.factory_id
FROM material_topics mt
CROSS JOIN topic_ids
WHERE mt.topic_id = topic_ids.retired_id
  AND topic_ids.retired_id IS NOT NULL
  AND topic_ids.factory_id IS NOT NULL
ON CONFLICT DO NOTHING;
--> statement-breakpoint

WITH topic_ids AS (
    SELECT
        MAX(CASE WHEN code = 'retired' THEN id END) AS retired_id,
        MAX(CASE WHEN code = 'factory' THEN id END) AS factory_id,
        MAX(CASE WHEN code = 'factory-dismissed' THEN id END) AS factory_dismissed_id
    FROM topics
)
INSERT INTO material_topics (material_id, topic_id)
SELECT mt.material_id, topic_ids.factory_dismissed_id
FROM material_topics mt
CROSS JOIN topic_ids
WHERE mt.topic_id = topic_ids.retired_id
  AND topic_ids.retired_id IS NOT NULL
  AND topic_ids.factory_dismissed_id IS NOT NULL
ON CONFLICT DO NOTHING;
--> statement-breakpoint

WITH topic_ids AS (
    SELECT
        MAX(CASE WHEN code = 'retired' THEN id END) AS retired_id,
        MAX(CASE WHEN code = 'factory' THEN id END) AS factory_id,
        MAX(CASE WHEN code = 'factory-dismissed' THEN id END) AS factory_dismissed_id
    FROM topics
)
DELETE FROM material_topics mt
USING topic_ids
WHERE mt.topic_id = topic_ids.retired_id
  AND topic_ids.retired_id IS NOT NULL
  AND topic_ids.factory_id IS NOT NULL
  AND topic_ids.factory_dismissed_id IS NOT NULL;
--> statement-breakpoint

WITH topic_ids AS (
    SELECT
        MAX(CASE WHEN code = 'retired' THEN id END) AS retired_id,
        MAX(CASE WHEN code = 'factory' THEN id END) AS factory_id,
        MAX(CASE WHEN code = 'factory-dismissed' THEN id END) AS factory_dismissed_id
    FROM topics
)
INSERT INTO entity_topics (entity_id, topic_id)
SELECT et.entity_id, topic_ids.factory_id
FROM entity_topics et
CROSS JOIN topic_ids
WHERE et.topic_id = topic_ids.retired_id
  AND topic_ids.retired_id IS NOT NULL
  AND topic_ids.factory_id IS NOT NULL
ON CONFLICT DO NOTHING;
--> statement-breakpoint

WITH topic_ids AS (
    SELECT
        MAX(CASE WHEN code = 'retired' THEN id END) AS retired_id,
        MAX(CASE WHEN code = 'factory' THEN id END) AS factory_id,
        MAX(CASE WHEN code = 'factory-dismissed' THEN id END) AS factory_dismissed_id
    FROM topics
)
INSERT INTO entity_topics (entity_id, topic_id)
SELECT et.entity_id, topic_ids.factory_dismissed_id
FROM entity_topics et
CROSS JOIN topic_ids
WHERE et.topic_id = topic_ids.retired_id
  AND topic_ids.retired_id IS NOT NULL
  AND topic_ids.factory_dismissed_id IS NOT NULL
ON CONFLICT DO NOTHING;
--> statement-breakpoint

WITH topic_ids AS (
    SELECT
        MAX(CASE WHEN code = 'retired' THEN id END) AS retired_id,
        MAX(CASE WHEN code = 'factory' THEN id END) AS factory_id,
        MAX(CASE WHEN code = 'factory-dismissed' THEN id END) AS factory_dismissed_id
    FROM topics
)
DELETE FROM entity_topics et
USING topic_ids
WHERE et.topic_id = topic_ids.retired_id
  AND topic_ids.retired_id IS NOT NULL
  AND topic_ids.factory_id IS NOT NULL
  AND topic_ids.factory_dismissed_id IS NOT NULL;
