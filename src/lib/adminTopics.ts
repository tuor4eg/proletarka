import "server-only"

import { asc, count, eq, sql } from "drizzle-orm"
import { db } from "@/db"
import {
    artifacts,
    entities,
    entityTopics,
    eventTopics,
    events,
    materials,
    materialTopics,
    people,
    type EntityType,
    type MaterialType,
    type Status,
} from "@/db/schema"

export type TopicUsageCounts = {
    materialCount: number
    eventCount: number
    entityCount: number
    usageCount: number
}

export type TopicRelatedEventPeopleRow = {
    entityId: number
    personCode: string
    personName: string
    eventCount: number
}

export type TopicRelatedMaterialRow = {
    id: number
    title: string
    materialType: MaterialType
    status: Status
    personName: string | null
    artifactTitle: string | null
}

export type TopicRelatedEntityRow = {
    entityId: number
    entityType: EntityType
    personCode: string | null
    personName: string | null
    artifactCode: string | null
    artifactTitle: string | null
}

export type TopicRelatedRecordsParams = {
    eventPage: number
    materialPage: number
    entityPage: number
    pageSize?: number
}

export type TopicRelatedRecords = {
    eventPeopleRows: TopicRelatedEventPeopleRow[]
    eventPeopleTotal: number
    eventPeopleTotalPages: number
    materialRows: TopicRelatedMaterialRow[]
    materialTotal: number
    materialTotalPages: number
    entityRows: TopicRelatedEntityRow[]
    entityTotal: number
    entityTotalPages: number
}

function createEmptyTopicUsageCounts(): TopicUsageCounts {
    return {
        materialCount: 0,
        eventCount: 0,
        entityCount: 0,
        usageCount: 0,
    }
}

export async function getTopicUsageCountsMap(): Promise<Map<number, TopicUsageCounts>> {
    const [materialCountRows, eventCountRows, entityCountRows] = await Promise.all([
        db
            .select({
                topicId: materialTopics.topicId,
                total: count(materialTopics.materialId),
            })
            .from(materialTopics)
            .groupBy(materialTopics.topicId),
        db
            .select({
                topicId: eventTopics.topicId,
                total: count(eventTopics.eventId),
            })
            .from(eventTopics)
            .groupBy(eventTopics.topicId),
        db
            .select({
                topicId: entityTopics.topicId,
                total: count(entityTopics.entityId),
            })
            .from(entityTopics)
            .groupBy(entityTopics.topicId),
    ])

    const countsByTopicId = new Map<number, TopicUsageCounts>()

    for (const row of materialCountRows) {
        countsByTopicId.set(row.topicId, {
            ...createEmptyTopicUsageCounts(),
            materialCount: row.total,
        })
    }

    for (const row of eventCountRows) {
        const current = countsByTopicId.get(row.topicId) ?? createEmptyTopicUsageCounts()
        current.eventCount = row.total
        countsByTopicId.set(row.topicId, current)
    }

    for (const row of entityCountRows) {
        const current = countsByTopicId.get(row.topicId) ?? createEmptyTopicUsageCounts()
        current.entityCount = row.total
        countsByTopicId.set(row.topicId, current)
    }

    for (const counts of countsByTopicId.values()) {
        counts.usageCount = counts.materialCount + counts.eventCount + counts.entityCount
    }

    return countsByTopicId
}

export async function getTopicUsageCounts(topicId: number): Promise<TopicUsageCounts> {
    const [[materialRow], [eventRow], [entityRow]] = await Promise.all([
        db
            .select({ total: count(materialTopics.materialId) })
            .from(materialTopics)
            .where(eq(materialTopics.topicId, topicId)),
        db
            .select({ total: count(eventTopics.eventId) })
            .from(eventTopics)
            .where(eq(eventTopics.topicId, topicId)),
        db
            .select({ total: count(entityTopics.entityId) })
            .from(entityTopics)
            .where(eq(entityTopics.topicId, topicId)),
    ])

    const materialCount = materialRow?.total ?? 0
    const eventCount = eventRow?.total ?? 0
    const entityCount = entityRow?.total ?? 0

    return {
        materialCount,
        eventCount,
        entityCount,
        usageCount: materialCount + eventCount + entityCount,
    }
}

export async function getTopicRelatedRecords(
    topicId: number,
    params: TopicRelatedRecordsParams,
): Promise<TopicRelatedRecords> {
    const pageSize = params.pageSize ?? 10
    const [
        eventPeopleRows,
        eventPeopleTotalRows,
        materialRows,
        materialTotalRows,
        entityRows,
        entityTotalRows,
    ] = await Promise.all([
        db
            .select({
                entityId: entities.id,
                personCode: people.code,
                personName: people.name,
                eventCount: count(eventTopics.eventId),
            })
            .from(eventTopics)
            .innerJoin(events, eq(events.id, eventTopics.eventId))
            .innerJoin(entities, eq(entities.id, events.entityId))
            .innerJoin(people, eq(people.id, entities.personId))
            .where(eq(eventTopics.topicId, topicId))
            .groupBy(entities.id, people.code, people.name)
            .orderBy(asc(people.name))
            .limit(pageSize)
            .offset((params.eventPage - 1) * pageSize),
        db
            .select({ total: sql<number>`count(distinct ${entities.id})::int` })
            .from(eventTopics)
            .innerJoin(events, eq(events.id, eventTopics.eventId))
            .innerJoin(entities, eq(entities.id, events.entityId))
            .innerJoin(people, eq(people.id, entities.personId))
            .where(eq(eventTopics.topicId, topicId)),
        db
            .select({
                id: materials.id,
                title: materials.title,
                materialType: materials.materialType,
                status: materials.status,
                personName: people.name,
                artifactTitle: artifacts.title,
            })
            .from(materialTopics)
            .innerJoin(materials, eq(materials.id, materialTopics.materialId))
            .leftJoin(entities, eq(entities.id, materials.entityId))
            .leftJoin(people, eq(people.id, entities.personId))
            .leftJoin(artifacts, eq(artifacts.id, entities.artifactId))
            .where(eq(materialTopics.topicId, topicId))
            .orderBy(asc(materials.title), asc(materials.id))
            .limit(pageSize)
            .offset((params.materialPage - 1) * pageSize),
        db
            .select({ total: count(materialTopics.materialId) })
            .from(materialTopics)
            .where(eq(materialTopics.topicId, topicId)),
        db
            .select({
                entityId: entities.id,
                entityType: entities.type,
                personCode: people.code,
                personName: people.name,
                artifactCode: artifacts.code,
                artifactTitle: artifacts.title,
            })
            .from(entityTopics)
            .innerJoin(entities, eq(entities.id, entityTopics.entityId))
            .leftJoin(people, eq(people.id, entities.personId))
            .leftJoin(artifacts, eq(artifacts.id, entities.artifactId))
            .where(eq(entityTopics.topicId, topicId))
            .orderBy(sql`coalesce(${people.name}, ${artifacts.title})`, asc(entities.id))
            .limit(pageSize)
            .offset((params.entityPage - 1) * pageSize),
        db
            .select({ total: count(entityTopics.entityId) })
            .from(entityTopics)
            .where(eq(entityTopics.topicId, topicId)),
    ])

    const eventPeopleTotal = eventPeopleTotalRows[0]?.total ?? 0
    const materialTotal = materialTotalRows[0]?.total ?? 0
    const entityTotal = entityTotalRows[0]?.total ?? 0

    return {
        eventPeopleRows,
        eventPeopleTotal,
        eventPeopleTotalPages: Math.ceil(eventPeopleTotal / pageSize),
        materialRows,
        materialTotal,
        materialTotalPages: Math.ceil(materialTotal / pageSize),
        entityRows,
        entityTotal,
        entityTotalPages: Math.ceil(entityTotal / pageSize),
    }
}
