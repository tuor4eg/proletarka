import Link from "next/link"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { materials } from "@/db/schema"
import { formatMaterialDate, getMaterialPreviewText } from "@/lib/materialPresentation"

export async function HomeNews() {
    const items = await db
        .select({
            id: materials.id,
            title: materials.title,
            summary: materials.summary,
            content: materials.content,
            createdAt: materials.createdAt,
        })
        .from(materials)
        .where(and(eq(materials.status, "published"), eq(materials.materialType, "news")))
        .orderBy(desc(materials.createdAt))
        .limit(3)

    if (items.length === 0) return null

    return (
        <section className="pt-8 mb-10 border-b border-paper-border pb-8">
            <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-2xl font-bold tracking-widest uppercase text-ink">Новости</h2>
                <Link
                    href="/news"
                    className="text-xs text-ink-muted hover:text-ink transition-colors"
                >
                    Все новости
                </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
                {items.map((item) => {
                    const preview = getMaterialPreviewText(item.summary, item.content, 90)

                    return (
                        <Link
                            key={item.id}
                            href={`/materials/${item.id}`}
                            className="flex min-h-[150px] flex-col rounded-2xl border border-paper-border bg-white/50 p-4 hover:bg-white/80 transition-colors"
                        >
                            <p className="text-xs uppercase tracking-wide text-ink-muted mb-2">
                                {formatMaterialDate(item.createdAt)}
                            </p>
                            <h3 className="text-base font-semibold text-ink line-clamp-2">
                                {item.title}
                            </h3>
                            {preview && (
                                <p className="mt-2 text-sm text-ink-muted leading-relaxed line-clamp-3">
                                    {preview}
                                </p>
                            )}
                        </Link>
                    )
                })}
            </div>
        </section>
    )
}
