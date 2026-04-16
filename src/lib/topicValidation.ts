import { inArray } from "drizzle-orm"
import { db } from "@/db"
import { topics } from "@/db/schema"

export type TopicSelectionValidationResult =
    | { ok: true; topicIds: number[] }
    | { ok: false; message: string }

export async function validateTopicSelection(
    rawTopicIds: number[],
): Promise<TopicSelectionValidationResult> {
    const topicIds = Array.from(new Set(rawTopicIds.filter(Boolean)))

    if (topicIds.length === 0) {
        return { ok: true, topicIds: [] }
    }

    const rows = await db
        .select({
            id: topics.id,
            parentId: topics.parentId,
        })
        .from(topics)
        .where(inArray(topics.id, topicIds))

    if (rows.length !== topicIds.length) {
        return { ok: false, message: "Выбраны несуществующие темы" }
    }

    const topicIdsSet = new Set(topicIds)

    for (const row of rows) {
        if (row.parentId !== null && !topicIdsSet.has(row.parentId)) {
            return {
                ok: false,
                message: "Подтему нельзя выбрать без родительской темы",
            }
        }
    }

    return { ok: true, topicIds }
}
