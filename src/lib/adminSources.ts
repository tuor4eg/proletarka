import { db } from "@/db"
import { materialSources, personSources, sources } from "@/db/schema"
import { eq } from "drizzle-orm"

export type SourceFormValue = {
    label: string
    url: string
}

export function parseSourcesForm(formData: FormData): SourceFormValue[] {
    const labels = formData.getAll("sourceLabels").map((value) => String(value).trim())
    const urls = formData.getAll("sourceUrls").map((value) => String(value).trim())

    const count = Math.max(labels.length, urls.length)
    const result: SourceFormValue[] = []

    for (let index = 0; index < count; index += 1) {
        const label = labels[index] ?? ""
        const url = urls[index] ?? ""

        if (!label || !url) continue

        result.push({ label, url })
    }

    return result
}

export async function replaceMaterialSources(materialId: number, items: SourceFormValue[]) {
    await db.delete(materialSources).where(eq(materialSources.materialId, materialId))

    if (items.length === 0) return

    const insertedSources = await db.insert(sources).values(items).returning({ id: sources.id })

    await db.insert(materialSources).values(
        insertedSources.map((source) => ({
            materialId,
            sourceId: source.id,
        })),
    )
}

export async function replacePersonSources(personId: number, items: SourceFormValue[]) {
    await db.delete(personSources).where(eq(personSources.personId, personId))

    if (items.length === 0) return

    const insertedSources = await db.insert(sources).values(items).returning({ id: sources.id })

    await db.insert(personSources).values(
        insertedSources.map((source) => ({
            personId,
            sourceId: source.id,
        })),
    )
}
