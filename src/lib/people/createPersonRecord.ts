import { eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import {
    adminLogs,
    entities,
    events,
    eventTopics,
    people,
    personSources,
    sources,
} from "@/db/schema"
import { generateCode, CODE_PATTERN } from "@/lib/generateCode"
import type { SourceFormValue } from "@/lib/adminSources"
import { validateTopicSelection } from "@/lib/topicValidation"

export type CreatePersonRecordEventInput = {
    text: string
    yearFrom: number | null
    yearTo: number | null
    yearsLabel: string | null
    topicIds: number[]
}

export type CreatePersonRecordInput = {
    person: {
        name: string
        shortBio: string | null
        birthYear: number | null
        deathYear: number | null
        yearsLabel: string | null
        mainPhotoPath: string | null
    }
    sources?: SourceFormValue[]
    events?: CreatePersonRecordEventInput[]
    code?: string
    log?: {
        userId: number
    }
}

export type CreatePersonRecordResult = {
    personId: number
    entityId: number
    code: string
    eventsCount: number
    sourcesCount: number
}

async function validateEventTopicIds(topicIds: number[]): Promise<number[]> {
    const validation = await validateTopicSelection(topicIds)
    if (!validation.ok) throw new Error(validation.message)
    return validation.topicIds
}

function dedupeSourcesByUrl(items: SourceFormValue[]): SourceFormValue[] {
    const byUrl = new Map<string, SourceFormValue>()

    for (const item of items) {
        if (!byUrl.has(item.url)) {
            byUrl.set(item.url, item)
        }
    }

    return Array.from(byUrl.values())
}

export async function createPersonRecord(
    input: CreatePersonRecordInput,
): Promise<CreatePersonRecordResult> {
    const code = input.code?.trim() || generateCode(input.person.name)
    if (!CODE_PATTERN.test(code)) {
        throw new Error("Недопустимый формат code")
    }

    const existing = await db.select({ id: people.id }).from(people).where(eq(people.code, code))
    if (existing.length > 0) {
        throw new Error("Этот code уже занят")
    }

    const eventInputs = input.events ?? []
    const validatedEvents: CreatePersonRecordEventInput[] = []
    for (const event of eventInputs) {
        validatedEvents.push({
            ...event,
            topicIds: await validateEventTopicIds(event.topicIds),
        })
    }

    return db.transaction(async (tx) => {
        const [person] = await tx
            .insert(people)
            .values({ ...input.person, code })
            .returning({ id: people.id })

        const [entity] = await tx
            .insert(entities)
            .values({ type: "person", personId: person.id, code })
            .returning({ id: entities.id })

        const sourceItems = dedupeSourcesByUrl(input.sources ?? [])
        if (sourceItems.length > 0) {
            const sourceUrls = sourceItems.map((item) => item.url)
            const existingSources = await tx
                .select({ id: sources.id, url: sources.url })
                .from(sources)
                .where(inArray(sources.url, sourceUrls))

            const existingSourceIdsByUrl = new Map<string, number>()
            for (const source of existingSources) {
                if (!existingSourceIdsByUrl.has(source.url)) {
                    existingSourceIdsByUrl.set(source.url, source.id)
                }
            }

            const missingSourceItems = sourceItems.filter(
                (item) => !existingSourceIdsByUrl.has(item.url),
            )

            const insertedSources =
                missingSourceItems.length > 0
                    ? await tx
                          .insert(sources)
                          .values(missingSourceItems)
                          .returning({ id: sources.id, url: sources.url })
                    : []

            const sourceIds = [
                ...Array.from(existingSourceIdsByUrl.values()),
                ...insertedSources.map((source) => source.id),
            ]

            await tx.insert(personSources).values(
                sourceIds.map((sourceId) => ({
                    personId: person.id,
                    sourceId,
                })),
            )
        }

        for (const eventInput of validatedEvents) {
            const eventCode = generateCode(eventInput.text)
            const [event] = await tx
                .insert(events)
                .values({
                    code: eventCode,
                    entityId: entity.id,
                    text: eventInput.text,
                    yearFrom: eventInput.yearFrom,
                    yearTo: eventInput.yearTo,
                    yearsLabel: eventInput.yearsLabel,
                })
                .returning({ id: events.id })

            if (eventInput.topicIds.length > 0) {
                await tx.insert(eventTopics).values(
                    eventInput.topicIds.map((topicId) => ({
                        eventId: event.id,
                        topicId,
                    })),
                )
            }
        }

        if (input.log) {
            await tx.insert(adminLogs).values({
                userId: input.log.userId,
                action: "create",
                entityType: "person",
                entityId: person.id,
                entityTitle: input.person.name,
            })
        }

        return {
            personId: person.id,
            entityId: entity.id,
            code,
            eventsCount: validatedEvents.length,
            sourcesCount: sourceItems.length,
        }
    })
}
