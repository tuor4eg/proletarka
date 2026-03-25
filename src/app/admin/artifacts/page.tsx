import Link from "next/link"
import { eq, asc, count } from "drizzle-orm"
import { db } from "@/db"
import { entities, artifacts } from "@/db/schema"

export default async function ArtifactsPage() {
    const rows = await db
        .select({
            entityId: entities.id,
            title: artifacts.title,
            yearsLabel: artifacts.yearsLabel,
        })
        .from(entities)
        .innerJoin(artifacts, eq(entities.artifactId, artifacts.id))
        .orderBy(asc(artifacts.title))

    return (
        <div className="py-6">
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-bold">Исторические объекты</h1>
                <Link
                    href="/admin/artifacts/new"
                    className="text-sm bg-black text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors"
                >
                    + Добавить
                </Link>
            </div>
            {rows.length === 0 ? (
                <p className="text-sm text-gray-500">Нет исторических объектов.</p>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {rows.map((row) => (
                        <Link
                            key={row.entityId}
                            href={`/admin/artifacts/${row.entityId}`}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                        >
                            <span className="text-sm font-medium flex-1">{row.title}</span>
                            {row.yearsLabel && (
                                <span className="text-xs text-gray-400">{row.yearsLabel}</span>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
