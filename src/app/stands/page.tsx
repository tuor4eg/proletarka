export const dynamic = 'force-dynamic'

import Link from "next/link"
import { db } from "@/db"
import { entities, artifacts } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { PublicNavWrapper } from "@/components/PublicNavWrapper"

export default async function StandsPage() {
    const rows = await db
        .select({
            code: artifacts.code,
            title: artifacts.title,
            yearsLabel: artifacts.yearsLabel,
            coverImagePath: artifacts.coverImagePath,
        })
        .from(artifacts)
        .innerJoin(entities, eq(entities.artifactId, artifacts.id))
        .where(eq(artifacts.artifactType, "stand"))
        .orderBy(asc(artifacts.title))

    return (
        <>
            <PublicNavWrapper />
            <main className="max-w-2xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Стенды</h1>
                {rows.length === 0 ? (
                    <p className="text-sm text-gray-500">Стенды не найдены.</p>
                ) : (
                    <div className="flex flex-col divide-y divide-gray-100">
                        {rows.map((row) => (
                            <Link
                                key={row.code}
                                href={`/artifacts/${row.code}`}
                                className="flex items-center gap-3 py-3 hover:opacity-70 transition-opacity"
                            >
                                <div className="w-14 h-14 shrink-0 rounded overflow-hidden bg-gray-100">
                                    {row.coverImagePath ? (
                                        <img
                                            src={row.coverImagePath}
                                            alt={row.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{row.title}</p>
                                    {row.yearsLabel && (
                                        <p className="text-xs text-gray-400">{row.yearsLabel}</p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </>
    )
}
