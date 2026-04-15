import { eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { entities, people, events, eventTopics, topics } from "@/db/schema"
import { fetchFirstPhotoMap } from "@/db/queries"
import type { WarPeopleTabKey } from "@/lib/warSections"

const WAR_RELATED_TOPIC_CODES = ["war", "factory", "retired"] as const
const WAR_DEATH_YEAR_THRESHOLD = 1945

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
    hasRetired: boolean
    firstWarYear: number | null
    firstFactoryYear: number | null
}

export type WarPeopleBuckets = Record<WarPeopleTabKey, WarPerson[]>

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
        hasRetired: false,
        firstWarYear: null,
        firstFactoryYear: null,
    }
}

function applyTopicToPerson(
    person: WarPersonComputed,
    topicCode: WarRelatedTopicCode,
    yearFrom: number | null,
) {
    if (topicCode === "war") {
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

    if (topicCode === "retired") {
        person.hasRetired = true
    }
}

function isDeadBeforeOrIn1945(person: WarPersonComputed) {
    return person.deathYear !== null && person.deathYear <= WAR_DEATH_YEAR_THRESHOLD
}

function isDeadAfter1945OrAlive(person: WarPersonComputed) {
    return person.deathYear === null || person.deathYear > WAR_DEATH_YEAR_THRESHOLD
}

function hasFactoryEarlierThanWar(person: WarPersonComputed) {
    return (
        person.firstFactoryYear !== null &&
        person.firstWarYear !== null &&
        person.firstFactoryYear < person.firstWarYear
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

function buildWarPeopleBuckets(people: WarPersonComputed[]): WarPeopleBuckets {
    return {
        "not-returned": people.filter(
            (person) =>
                person.hasWar &&
                isDeadBeforeOrIn1945(person) &&
                hasFactoryEarlierThanWar(person) &&
                !person.hasRetired,
        ),
        "former-workers": people.filter(
            (person) =>
                person.hasWar &&
                isDeadBeforeOrIn1945(person) &&
                hasFactoryEarlierThanWar(person) &&
                person.hasRetired,
        ),
        "factory-to-front": people.filter(
            (person) =>
                person.hasWar && isDeadAfter1945OrAlive(person) && hasFactoryEarlierThanWar(person),
        ),
        "joined-after-war": people.filter(
            (person) =>
                person.hasWar && isDeadAfter1945OrAlive(person) && hasFactoryLaterThanWar(person),
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

        if (row.topicCode === "war" || row.topicCode === "factory" || row.topicCode === "retired") {
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
