import Link from "next/link"
import { db } from "@/db"
import { entities, people } from "@/db/schema"
import { eq, desc, sql } from "drizzle-orm"
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
        .orderBy(sql`${people.mainPhotoPath} IS NULL`, desc(entities.id))
        .limit(8)

    return (
        <section className="border-t border-paper-border pt-8 mb-10 lg:border-t-0 lg:pt-6">
            <p className="text-xs tracking-widest text-ink-muted uppercase mb-3">Люди</p>
            <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-lg font-semibold text-ink">Работники завода</h2>
                <Link
                    href="/people"
                    className="text-xs text-ink-muted hover:text-ink transition-colors"
                >
                    Все
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
