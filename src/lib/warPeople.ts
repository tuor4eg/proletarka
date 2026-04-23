import { eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { entities, people, events, eventTopics, topics } from "@/db/schema"
import { fetchFirstPhotoMap } from "@/db/queries"
import type { WarPeopleTabKey } from "@/lib/warSections"

const WAR_RELATED_TOPIC_CODES = [
    "war",
    "war-mobilization",
    "war-killed",
    "factory",
    "factory-dismissed",
] as const
export const WAR_HOME_FRONT_WORKERS_TOPIC_CODE = "war-home-front-workers" as const
export const WAR_PRISONERS_TOPIC_CODE = "war-prisoners" as const
export const WAR_234_DIVISION_TOPIC_CODE = "war-234-division" as const
export const WAR_PARTISANS_TOPIC_CODE = "war-partisans" as const

type WarRelatedTopicCode = (typeof WAR_RELATED_TOPIC_CODES)[number]

export type WarPerson = {
    entityId: number
    code: string
    name: string
    birthYear: number | null
    deathYear: number | null
    yearsLabel: string | null
    mainPhotoPath: string | null
    shortBio: string | null
}

type WarPersonComputed = WarPerson & {
    hasWar: boolean
    hasWarKilled: boolean
    hasDismissed: boolean
    firstWarYear: number | null
    firstFactoryYear: number | null
}

export type WarPeopleBuckets = Record<WarPeopleTabKey, WarPerson[]>
export type WarTopicPeopleResult = {
    topic: { id: number } | null
    people: WarPerson[]
    count: number
    availableLetters: string[]
    fallbackMap: Map<number, string>
}

export function formatWarPersonYears(
    birthYear: number | null,
    deathYear: number | null,
    yearsLabel: string | null,
) {
    if (birthYear || deathYear) return `${birthYear ?? "?"}–${deathYear ?? "..."}`
    return yearsLabel ?? null
}

function getInitialComputedPerson(row: WarPerson): WarPersonComputed {
    return {
        ...row,
        hasWar: false,
        hasWarKilled: false,
        hasDismissed: false,
        firstWarYear: null,
        firstFactoryYear: null,
    }
}

function applyTopicToPerson(
    person: WarPersonComputed,
    topicCode: WarRelatedTopicCode,
    yearFrom: number | null,
) {
    if (topicCode === "war-mobilization" || topicCode === "war-killed") {
        person.hasWar = true
        if (yearFrom !== null) {
            person.firstWarYear =
                person.firstWarYear === null ? yearFrom : Math.min(person.firstWarYear, yearFrom)
        }
    }

    if (topicCode === "factory" && yearFrom !== null) {
        person.firstFactoryYear =
            person.firstFactoryYear === null
                ? yearFrom
                : Math.min(person.firstFactoryYear, yearFrom)
    }

    if (topicCode === "factory-dismissed") {
        person.hasDismissed = true
    }

    if (topicCode === "war-killed") {
        person.hasWarKilled = true
    }
}

function hasFactoryBeforeOrInWarYear(person: WarPersonComputed) {
    return (
        person.firstFactoryYear !== null &&
        person.firstWarYear !== null &&
        person.firstFactoryYear <= person.firstWarYear
    )
}

function hasFactoryLaterThanWar(person: WarPersonComputed) {
    return (
        person.firstFactoryYear !== null &&
        person.firstWarYear !== null &&
        person.firstFactoryYear > person.firstWarYear
    )
}

function getPersonFirstLetter(name: string) {
    return name.trim().charAt(0).toUpperCase()
}

function isWarRelatedTopicCode(topicCode: string): topicCode is WarRelatedTopicCode {
    return (WAR_RELATED_TOPIC_CODES as readonly string[]).includes(topicCode)
}

async function getPeopleForExactTopicCode(topicCode: string): Promise<WarTopicPeopleResult> {
    const [topicRow] = await db
        .select({ id: topics.id })
        .from(topics)
        .where(eq(topics.code, topicCode))
        .limit(1)

    if (!topicRow) {
        return {
            topic: null,
            people: [],
            count: 0,
            availableLetters: [],
            fallbackMap: new Map<number, string>(),
        }
    }

    const rows = await db
        .select({
            entityId: entities.id,
            code: people.code,
            name: people.name,
            birthYear: people.birthYear,
            deathYear: people.deathYear,
            yearsLabel: people.yearsLabel,
            mainPhotoPath: people.mainPhotoPath,
            shortBio: people.shortBio,
        })
        .from(entities)
        .innerJoin(people, eq(entities.personId, people.id))
        .innerJoin(events, eq(events.entityId, entities.id))
        .innerJoin(eventTopics, eq(eventTopics.eventId, events.id))
        .innerJoin(topics, eq(topics.id, eventTopics.topicId))
        .where(eq(topics.code, topicCode))

    const peopleMap = new Map<number, WarPerson>()

    for (const row of rows) {
        if (!peopleMap.has(row.entityId)) {
            peopleMap.set(row.entityId, {
                entityId: row.entityId,
                code: row.code,
                name: row.name,
                birthYear: row.birthYear,
                deathYear: row.deathYear,
                yearsLabel: row.yearsLabel,
                mainPhotoPath: row.mainPhotoPath,
                shortBio: row.shortBio,
            })
        }
    }

    const topicPeople = Array.from(peopleMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name, "ru"),
    )
    const availableLetters = Array.from(
        new Set(topicPeople.map((person) => getPersonFirstLetter(person.name))),
    ).sort((a, b) => a.localeCompare(b, "ru"))

    const noPhotoIds = topicPeople
        .filter((person) => !person.mainPhotoPath)
        .map((person) => person.entityId)
    const fallbackMap = await fetchFirstPhotoMap(noPhotoIds)

    return {
        topic: { id: topicRow.id },
        people: topicPeople,
        count: topicPeople.length,
        availableLetters,
        fallbackMap,
    }
}

function buildWarPeopleBuckets(people: WarPersonComputed[]): WarPeopleBuckets {
    return {
        "not-returned": people.filter(
            (person) =>
                person.hasWar &&
                person.hasWarKilled &&
                hasFactoryBeforeOrInWarYear(person) &&
                !person.hasDismissed,
        ),
        "former-workers": people.filter(
            (person) =>
                person.hasWar &&
                person.hasWarKilled &&
                hasFactoryBeforeOrInWarYear(person) &&
                person.hasDismissed,
        ),
        "factory-to-front": people.filter(
            (person) =>
                person.hasWar && !person.hasWarKilled && hasFactoryBeforeOrInWarYear(person),
        ),
        "joined-after-war": people.filter(
            (person) => person.hasWar && !person.hasWarKilled && hasFactoryLaterThanWar(person),
        ),
    }
}

export async function getWarPeopleBuckets() {
    const topicRows = await db
        .select({ id: topics.id, code: topics.code })
        .from(topics)
        .where(inArray(topics.code, [...WAR_RELATED_TOPIC_CODES]))

    const topicIdByCode = new Map(topicRows.map((row) => [row.code, row.id]))
    const warTopicId = topicIdByCode.get("war")

    const emptyBuckets = {
        "not-returned": [],
        "former-workers": [],
        "factory-to-front": [],
        "joined-after-war": [],
    } satisfies WarPeopleBuckets

    if (!warTopicId) {
        return {
            warTopic: null,
            allWarPeople: [] as WarPerson[],
            buckets: emptyBuckets,
            counts: {
                "not-returned": 0,
                "former-workers": 0,
                "factory-to-front": 0,
                "joined-after-war": 0,
            } as Record<WarPeopleTabKey, number>,
            availableLettersByTab: {
                "not-returned": [],
                "former-workers": [],
                "factory-to-front": [],
                "joined-after-war": [],
            } as Record<WarPeopleTabKey, string[]>,
            fallbackMap: new Map<number, string>(),
        }
    }

    const rows = await db
        .select({
            entityId: entities.id,
            code: people.code,
            name: people.name,
            birthYear: people.birthYear,
            deathYear: people.deathYear,
            yearsLabel: people.yearsLabel,
            mainPhotoPath: people.mainPhotoPath,
            shortBio: people.shortBio,
            topicCode: topics.code,
            yearFrom: events.yearFrom,
        })
        .from(entities)
        .innerJoin(people, eq(entities.personId, people.id))
        .innerJoin(events, eq(events.entityId, entities.id))
        .innerJoin(eventTopics, eq(eventTopics.eventId, events.id))
        .innerJoin(topics, eq(topics.id, eventTopics.topicId))
        .where(inArray(topics.code, [...WAR_RELATED_TOPIC_CODES]))

    const peopleMap = new Map<number, WarPersonComputed>()

    for (const row of rows) {
        if (!peopleMap.has(row.entityId)) {
            peopleMap.set(
                row.entityId,
                getInitialComputedPerson({
                    entityId: row.entityId,
                    code: row.code,
                    name: row.name,
                    birthYear: row.birthYear,
                    deathYear: row.deathYear,
                    yearsLabel: row.yearsLabel,
                    mainPhotoPath: row.mainPhotoPath,
                    shortBio: row.shortBio,
                }),
            )
        }

        const person = peopleMap.get(row.entityId)!

        if (isWarRelatedTopicCode(row.topicCode)) {
            applyTopicToPerson(person, row.topicCode, row.yearFrom)
        }
    }

    const allWarPeople = Array.from(peopleMap.values())
        .filter((person) => person.hasWar)
        .sort((a, b) => a.name.localeCompare(b.name, "ru"))

    const buckets = buildWarPeopleBuckets(allWarPeople)

    const counts = {
        "not-returned": buckets["not-returned"].length,
        "former-workers": buckets["former-workers"].length,
        "factory-to-front": buckets["factory-to-front"].length,
        "joined-after-war": buckets["joined-after-war"].length,
    } satisfies Record<WarPeopleTabKey, number>

    const availableLettersByTab = {
        "not-returned": Array.from(
            new Set(buckets["not-returned"].map((person) => getPersonFirstLetter(person.name))),
        ).sort((a, b) => a.localeCompare(b, "ru")),
        "former-workers": Array.from(
            new Set(buckets["former-workers"].map((person) => getPersonFirstLetter(person.name))),
        ).sort((a, b) => a.localeCompare(b, "ru")),
        "factory-to-front": Array.from(
            new Set(buckets["factory-to-front"].map((person) => getPersonFirstLetter(person.name))),
        ).sort((a, b) => a.localeCompare(b, "ru")),
        "joined-after-war": Array.from(
            new Set(buckets["joined-after-war"].map((person) => getPersonFirstLetter(person.name))),
        ).sort((a, b) => a.localeCompare(b, "ru")),
    } satisfies Record<WarPeopleTabKey, string[]>

    const noPhotoIds = allWarPeople
        .filter((person) => !person.mainPhotoPath)
        .map((person) => person.entityId)
    const fallbackMap = await fetchFirstPhotoMap(noPhotoIds)

    return {
        warTopic: { id: warTopicId },
        allWarPeople: allWarPeople as WarPerson[],
        buckets: buckets as WarPeopleBuckets,
        counts,
        availableLettersByTab,
        fallbackMap,
    }
}

export async function getWarTopicPeople(topicCode: string) {
    return getPeopleForExactTopicCode(topicCode)
}
