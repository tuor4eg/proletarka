export const dynamic = "force-dynamic"

import Link from "next/link"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { materials } from "@/db/schema"
import { PageHero } from "@/components/PageHero"
import { formatMaterialDate, getMaterialPreviewText } from "@/lib/materialPresentation"

export default async function NewsPage() {
    const items = await db
        .select({
            id: materials.id,
            title: materials.title,
            summary: materials.summary,
            content: materials.content,
            coverImagePath: materials.coverImagePath,
            createdAt: materials.createdAt,
        })
        .from(materials)
        .where(and(eq(materials.status, "published"), eq(materials.materialType, "news")))
        .orderBy(desc(materials.createdAt))

    return (
        <>
            <PageHero title="Новости" />
            <main className="max-w-2xl mx-auto px-4 py-8">
                {items.length === 0 ? (
                    <p className="text-sm text-ink-muted">Новостей пока нет.</p>
                ) : (
                    <div className="flex flex-col divide-y divide-paper-border">
                        {items.map((item) => {
                            const preview = getMaterialPreviewText(item.summary, item.content, 220)

                            return (
                                <article key={item.id} className="py-5 first:pt-0">
                                    <Link
                                        href={`/materials/${item.id}`}
                                        className="block hover:opacity-75 transition-opacity"
                                    >
                                        <div className="flex items-start gap-4">
                                            {item.coverImagePath && (
                                                <img
                                                    src={item.coverImagePath}
                                                    alt={item.title}
                                                    className="w-24 h-24 object-cover rounded-xl shrink-0"
                                                />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs uppercase tracking-wide text-ink-muted mb-1">
                                                    {formatMaterialDate(item.createdAt)}
                                                </p>
                                                <h2 className="text-lg font-semibold mb-2">
                                                    {item.title}
                                                </h2>
                                                {preview && (
                                                    <p className="text-sm text-ink-muted leading-relaxed">
                                                        {preview}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </article>
                            )
                        })}
                    </div>
                )}
            </main>
        </>
    )
}
