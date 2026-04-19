import { asc, eq, inArray, or } from "drizzle-orm"
import { db } from "@/db"
import { entities, eventTopics, events, people, topics } from "@/db/schema"
import type {
    WarTimelineEvent,
    WarTimelineGroupedEvent,
    WarTimelineItem,
} from "@/components/WarTimeline"

const GROUPED_TIMELINE_CODES = new Set([
    "war-mobilization",
    "war-demobilization",
    "war-killed",
] as const)

function getTimelineTopicSpecificity(topicCode: string) {
    return topicCode === "war" ? 0 : 1
}

function getTimelineItemPriority(topicCode: string) {
    if (topicCode === "war-mobilization") return 0
    if (topicCode === "war-demobilization") return 2
    if (topicCode === "war-killed") return 3
    return 1
}

function getGroupedTimelineLabel(topicCode: WarTimelineGroupedEvent["topicCode"]) {
    if (topicCode === "war-mobilization") return "Призваны на военную службу"
    if (topicCode === "war-demobilization") return "Демобилизованы"
    return "Погибли"
}

export async function getWarTimeline(warTopicId: number): Promise<WarTimelineItem[]> {
    const warTimelineTopicRows = await db
        .select({
            id: topics.id,
            code: topics.code,
        })
        .from(topics)
        .where(or(eq(topics.id, warTopicId), eq(topics.parentId, warTopicId)))

    const warTimelineTopicIds = warTimelineTopicRows.map((topic) => topic.id)

    if (warTimelineTopicIds.length === 0) {
        return []
    }

    const rawTimelineEvents = await db
        .select({
            id: events.id,
            text: events.text,
            yearFrom: events.yearFrom,
            yearTo: events.yearTo,
            yearsLabel: events.yearsLabel,
            entityId: events.entityId,
            personName: people.name,
            personCode: people.code,
            topicCode: topics.code,
        })
        .from(events)
        .innerJoin(eventTopics, eq(eventTopics.eventId, events.id))
        .innerJoin(topics, eq(topics.id, eventTopics.topicId))
        .innerJoin(entities, eq(entities.id, events.entityId))
        .innerJoin(people, eq(people.id, entities.personId))
        .where(inArray(eventTopics.topicId, warTimelineTopicIds))
        .orderBy(asc(events.yearFrom), asc(events.id))

    const timelineEventsById = new Map<number, (typeof rawTimelineEvents)[number]>()

    for (const row of rawTimelineEvents) {
        const current = timelineEventsById.get(row.id)

        if (
            !current ||
            getTimelineTopicSpecificity(row.topicCode) >
                getTimelineTopicSpecificity(current.topicCode)
        ) {
            timelineEventsById.set(row.id, row)
        }
    }

    const dedupedTimelineEvents = Array.from(timelineEventsById.values())
    const groupedTimelineItems = new Map<string, WarTimelineGroupedEvent>()
    const plainTimelineEvents: WarTimelineEvent[] = []

    for (const row of dedupedTimelineEvents) {
        if (GROUPED_TIMELINE_CODES.has(row.topicCode as WarTimelineGroupedEvent["topicCode"])) {
            const topicCode = row.topicCode as WarTimelineGroupedEvent["topicCode"]
            const groupKey = `${row.yearFrom ?? "undated"}:${topicCode}`

            if (!groupedTimelineItems.has(groupKey)) {
                groupedTimelineItems.set(groupKey, {
                    kind: "group",
                    id: groupKey,
                    topicCode,
                    label: getGroupedTimelineLabel(topicCode),
                    yearFrom: row.yearFrom,
                    people: [],
                })
            }

            const group = groupedTimelineItems.get(groupKey)!
            if (!group.people.some((person) => person.code === row.personCode)) {
                group.people.push({ name: row.personName, code: row.personCode })
            }
            continue
        }

        plainTimelineEvents.push({
            kind: "event",
            id: row.id,
            topicCode: row.topicCode,
            text: row.text,
            yearFrom: row.yearFrom,
            yearTo: row.yearTo,
            yearsLabel: row.yearsLabel,
            entityId: row.entityId,
            personName: row.personName,
            personCode: row.personCode,
        })
    }

    for (const group of groupedTimelineItems.values()) {
        group.people.sort((a, b) => a.name.localeCompare(b.name, "ru"))
    }

    return [...plainTimelineEvents, ...groupedTimelineItems.values()].sort((a, b) => {
        if (a.yearFrom === null && b.yearFrom === null) {
            return getTimelineItemPriority(a.topicCode) - getTimelineItemPriority(b.topicCode)
        }
        if (a.yearFrom === null) return 1
        if (b.yearFrom === null) return -1
        if (a.yearFrom !== b.yearFrom) return a.yearFrom - b.yearFrom

        const priorityDiff =
            getTimelineItemPriority(a.topicCode) - getTimelineItemPriority(b.topicCode)
        if (priorityDiff !== 0) return priorityDiff

        if (a.kind === "group" && b.kind === "group") {
            return a.label.localeCompare(b.label, "ru")
        }
        if (a.kind === "group") return -1
        if (b.kind === "group") return 1

        return a.id - b.id
    })
}
