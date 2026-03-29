import Link from "next/link"
import { db } from "@/db"
import { entities, people } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { PersonCardRow } from "@/components/PersonCardRow"

export async function HomePeople() {
    const recentPeople = await db
        .select({
            entityId: entities.id,
            name: people.name,
            years: people.yearsLabel,
            mainPhotoPath: people.mainPhotoPath,
        })
        .from(entities)
        .innerJoin(people, eq(entities.personId, people.id))
        .orderBy(desc(entities.id))
        .limit(4)

    return (
        <section className="mb-8">
            <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-lg font-semibold text-ink">Люди</h3>
                <Link
                    href="/people"
                    className="text-xs text-ink-muted hover:text-ink transition-colors"
                >
                    Подробнее
                </Link>
            </div>
            {recentPeople.length === 0 ? (
                <p className="text-sm text-ink-muted italic">— нет данных —</p>
            ) : (
                <PersonCardRow people={recentPeople} />
            )}
        </section>
    )
}
