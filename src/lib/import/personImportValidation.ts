import { and, eq, ilike, or } from "drizzle-orm"
import { db } from "@/db"
import { people, topics } from "@/db/schema"
import type { CreatePersonRecordInput } from "@/lib/people/createPersonRecord"
import { validateTopicSelection } from "@/lib/topicValidation"

export type PersonImportPayload = {
    person?: {
        name?: unknown
        shortBio?: unknown
        birthYear?: unknown
        deathYear?: unknown
        yearsLabel?: unknown
        mainPhotoPath?: unknown
    }
    events?: unknown
    allowPossibleDuplicate?: unknown
}

export type PersonImportValidationResult =
    | {
          ok: true
          input: CreatePersonRecordInput
          warnings: string[]
          possibleDuplicates: Array<{
              id: number
              code: string
              name: string
              birthYear: number | null
              deathYear: number | null
          }>
      }
    | {
          ok: false
          message: string
          fields: Array<{ path: string; message: string }>
      }

const MAX_NAME_LENGTH = 200
const MAX_BIO_LENGTH = 2000
const MAX_EVENTS = 30
const MAX_EVENT_TEXT_LENGTH = 1000
const MIN_YEAR = 1700
const MAX_YEAR = 2100

function optionalString(value: unknown): string | null {
    if (typeof value !== "string") return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function optionalYear(value: unknown): number | null {
    if (value === null || value === undefined || value === "") return null
    if (typeof value !== "number" || !Number.isInteger(value)) return NaN
    return value
}

function validateYear(
    value: number | null,
    path: string,
    fields: Array<{ path: string; message: string }>,
) {
    if (value === null) return
    if (!Number.isInteger(value) || value < MIN_YEAR || value > MAX_YEAR) {
        fields.push({ path, message: `Год должен быть целым числом от ${MIN_YEAR} до ${MAX_YEAR}` })
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

async function resolveTopicCodes(
    topicCodes: unknown,
    path: string,
    fields: Array<{ path: string; message: string }>,
): Promise<number[]> {
    if (topicCodes === undefined || topicCodes === null) return []
    if (!Array.isArray(topicCodes)) {
        fields.push({ path, message: "topicCodes должен быть массивом" })
        return []
    }

    const codes = Array.from(
        new Set(
            topicCodes.map((code) => (typeof code === "string" ? code.trim() : "")).filter(Boolean),
        ),
    )

    if (codes.length === 0) return []

    const rows = await db
        .select({ id: topics.id, code: topics.code })
        .from(topics)
        .where(or(...codes.map((code) => eq(topics.code, code))))

    if (rows.length !== codes.length) {
        const knownCodes = new Set(rows.map((row) => row.code))
        const unknownCodes = codes.filter((code) => !knownCodes.has(code))
        fields.push({
            path,
            message: `Неизвестные темы: ${unknownCodes.join(", ")}`,
        })
    }

    const topicIds = rows.map((row) => row.id)
    const validation = await validateTopicSelection(topicIds)
    if (!validation.ok) {
        fields.push({
            path,
            message: validation.message,
        })
        return topicIds
    }

    return validation.topicIds
}

async function findPossibleDuplicates(name: string, birthYear: number | null) {
    return db
        .select({
            id: people.id,
            code: people.code,
            name: people.name,
            birthYear: people.birthYear,
            deathYear: people.deathYear,
        })
        .from(people)
        .where(
            birthYear
                ? or(
                      eq(people.name, name),
                      and(ilike(people.name, name), eq(people.birthYear, birthYear)),
                  )
                : eq(people.name, name),
        )
        .limit(10)
}

export async function validatePersonImportPayload(
    payload: unknown,
): Promise<PersonImportValidationResult> {
    const fields: Array<{ path: string; message: string }> = []
    const warnings: string[] = []

    if (!isRecord(payload)) {
        return {
            ok: false,
            message: "Payload должен быть JSON-объектом",
            fields: [{ path: "$", message: "Ожидался объект" }],
        }
    }

    const personRaw = payload.person
    if (!isRecord(personRaw)) {
        return {
            ok: false,
            message: "Не передан объект person",
            fields: [{ path: "person", message: "person обязателен" }],
        }
    }

    const name = optionalString(personRaw.name)
    if (!name) fields.push({ path: "person.name", message: "Имя обязательно" })
    if (name && name.length > MAX_NAME_LENGTH) {
        fields.push({ path: "person.name", message: `Имя не длиннее ${MAX_NAME_LENGTH} символов` })
    }

    const shortBio = optionalString(personRaw.shortBio)
    if (shortBio && shortBio.length > MAX_BIO_LENGTH) {
        fields.push({
            path: "person.shortBio",
            message: `Биография не длиннее ${MAX_BIO_LENGTH} символов`,
        })
    }

    const yearsLabel = optionalString(personRaw.yearsLabel)
    const mainPhotoPath = optionalString(personRaw.mainPhotoPath)
    if (mainPhotoPath) {
        fields.push({
            path: "person.mainPhotoPath",
            message: "Импорт обложки пока не поддерживается",
        })
    }
    const birthYear = optionalYear(personRaw.birthYear)
    const deathYear = optionalYear(personRaw.deathYear)

    validateYear(birthYear, "person.birthYear", fields)
    validateYear(deathYear, "person.deathYear", fields)

    if (
        Number.isInteger(birthYear) &&
        Number.isInteger(deathYear) &&
        birthYear !== null &&
        deathYear !== null &&
        deathYear < birthYear
    ) {
        fields.push({
            path: "person.deathYear",
            message: "Год смерти не может быть раньше рождения",
        })
    }

    const eventsRaw = payload.events
    const eventInputs: CreatePersonRecordInput["events"] = []
    if (eventsRaw !== undefined && eventsRaw !== null) {
        if (!Array.isArray(eventsRaw)) {
            fields.push({ path: "events", message: "events должен быть массивом" })
        } else if (eventsRaw.length > MAX_EVENTS) {
            fields.push({ path: "events", message: `Не больше ${MAX_EVENTS} событий за импорт` })
        } else {
            for (const [index, eventRaw] of eventsRaw.entries()) {
                const basePath = `events.${index}`
                if (!isRecord(eventRaw)) {
                    fields.push({ path: basePath, message: "Событие должно быть объектом" })
                    continue
                }

                const text = optionalString(eventRaw.text)
                if (!text) {
                    fields.push({ path: `${basePath}.text`, message: "Текст события обязателен" })
                    continue
                }
                if (text.length > MAX_EVENT_TEXT_LENGTH) {
                    fields.push({
                        path: `${basePath}.text`,
                        message: `Текст события не длиннее ${MAX_EVENT_TEXT_LENGTH} символов`,
                    })
                }

                const eventYearFrom = optionalYear(eventRaw.yearFrom)
                const eventYearTo = optionalYear(eventRaw.yearTo)
                validateYear(eventYearFrom, `${basePath}.yearFrom`, fields)
                validateYear(eventYearTo, `${basePath}.yearTo`, fields)

                const eventYearsLabel = optionalString(eventRaw.yearsLabel)
                const topicIds = await resolveTopicCodes(
                    eventRaw.topicCodes,
                    `${basePath}.topicCodes`,
                    fields,
                )

                eventInputs.push({
                    text,
                    yearFrom: Number.isNaN(eventYearFrom) ? null : eventYearFrom,
                    yearTo: Number.isNaN(eventYearTo) ? null : eventYearTo,
                    yearsLabel: eventYearsLabel,
                    topicIds,
                })
            }
        }
    }

    if ("sources" in payload) {
        fields.push({
            path: "sources",
            message:
                "Импорт источников через бота не поддерживается. Добавьте источники в админке.",
        })
    }

    if (fields.length > 0 || !name) {
        return {
            ok: false,
            message: "Payload не прошёл валидацию",
            fields,
        }
    }

    const possibleDuplicates = await findPossibleDuplicates(
        name,
        Number.isNaN(birthYear) ? null : birthYear,
    )
    const allowPossibleDuplicate = payload.allowPossibleDuplicate === true
    if (possibleDuplicates.length > 0) {
        warnings.push("Найдены возможные дубли человека")
        if (!allowPossibleDuplicate) {
            return {
                ok: false,
                message:
                    "Найден возможный дубль. Передайте allowPossibleDuplicate: true после проверки.",
                fields: [{ path: "person.name", message: "Возможный дубль человека" }],
            }
        }
    }

    return {
        ok: true,
        input: {
            person: {
                name,
                shortBio,
                birthYear: Number.isNaN(birthYear) ? null : birthYear,
                deathYear: Number.isNaN(deathYear) ? null : deathYear,
                yearsLabel,
                mainPhotoPath: null,
            },
            events: eventInputs,
        },
        warnings,
        possibleDuplicates,
    }
}
