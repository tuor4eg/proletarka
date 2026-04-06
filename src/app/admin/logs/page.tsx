import Link from "next/link"
import { Suspense } from "react"
import { desc, asc, count, eq, and } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { db } from "@/db"
import { adminLogs, users, people, artifacts, artifactSections } from "@/db/schema"

const artifactsForSection = alias(artifacts, "artifacts_for_section")
import { Pagination } from "@/components/Pagination"
import { LogsFilters } from "@/components/LogsFilters"

const PAGE_SIZE = 50

const ACTION_LABELS: Record<string, string> = {
    create: "создал",
    update: "обновил",
    delete: "удалил",
    publish: "опубликовал",
    unpublish: "снял с публикации",
}

const ENTITY_LABELS: Record<string, string> = {
    person: "Человек",
    artifact: "Объект",
    artifactSection: "Секция",
    material: "Материал",
    topic: "Тема",
}

function buildEntityLink(
    entityType: string,
    entityId: number | null,
    personCode: string | null,
    artifactCode: string | null,
    artifactCodeForSection: string | null,
): string | null {
    if (!entityId) return null
    if (entityType === "person") return personCode ? `/admin/people/${personCode}` : null
    if (entityType === "artifact") return artifactCode ? `/admin/artifacts/${artifactCode}` : null
    if (entityType === "artifactSection")
        return artifactCodeForSection ? `/admin/artifacts/${artifactCodeForSection}` : null
    if (entityType === "material") return `/admin/${entityId}`
    if (entityType === "topic") return `/admin/topics/${entityId}`
    return null
}

export default async function LogsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | undefined>>
}) {
    const { page: pageParam, action, entityType, userId, sort = "desc" } = await searchParams
    const page = Math.max(1, Number(pageParam) || 1)
    const orderBy = sort === "asc" ? asc(adminLogs.createdAt) : desc(adminLogs.createdAt)

    const conditions = [
        action
            ? eq(
                  adminLogs.action,
                  action as "create" | "update" | "delete" | "publish" | "unpublish",
              )
            : undefined,
        entityType
            ? eq(
                  adminLogs.entityType,
                  entityType as "person" | "artifact" | "artifactSection" | "material" | "topic",
              )
            : undefined,
        userId ? eq(adminLogs.userId, Number(userId)) : undefined,
    ].filter(Boolean) as Parameters<typeof and>

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, [{ total }], allUsers] = await Promise.all([
        db
            .select({
                id: adminLogs.id,
                action: adminLogs.action,
                entityType: adminLogs.entityType,
                entityId: adminLogs.entityId,
                entityTitle: adminLogs.entityTitle,
                createdAt: adminLogs.createdAt,
                userName: users.name,
                personCode: people.code,
                artifactCode: artifacts.code,
                artifactCodeForSection: artifactsForSection.code,
            })
            .from(adminLogs)
            .innerJoin(users, eq(adminLogs.userId, users.id))
            .leftJoin(
                people,
                and(eq(adminLogs.entityType, "person"), eq(adminLogs.entityId, people.id)),
            )
            .leftJoin(
                artifacts,
                and(eq(adminLogs.entityType, "artifact"), eq(adminLogs.entityId, artifacts.id)),
            )
            .leftJoin(
                artifactSections,
                and(
                    eq(adminLogs.entityType, "artifactSection"),
                    eq(adminLogs.entityId, artifactSections.id),
                ),
            )
            .leftJoin(artifactsForSection, eq(artifactSections.artifactId, artifactsForSection.id))
            .where(where)
            .orderBy(orderBy)
            .limit(PAGE_SIZE)
            .offset((page - 1) * PAGE_SIZE),
        db.select({ total: count() }).from(adminLogs).where(where),
        db.select({ id: users.id, name: users.name }).from(users).orderBy(asc(users.name)),
    ])

    const totalPages = Math.ceil(total / PAGE_SIZE)
    const filterParams = { action, entityType, userId, sort }

    return (
        <div className="py-6">
            <h1 className="text-xl font-bold mb-5">Журнал действий</h1>

            <Suspense>
                <LogsFilters
                    action={action ?? ""}
                    entityType={entityType ?? ""}
                    userId={userId ?? ""}
                    sort={sort}
                    users={allUsers}
                />
            </Suspense>

            {rows.length === 0 ? (
                <p className="text-sm text-ink-muted">Действий пока нет.</p>
            ) : (
                <>
                    <div className="bg-white border border-paper-dark rounded-xl overflow-hidden divide-y divide-paper-dark">
                        {rows.map((row) => {
                            const href = buildEntityLink(
                                row.entityType,
                                row.entityId,
                                row.personCode ?? null,
                                row.artifactCode ?? null,
                                row.artifactCodeForSection ?? null,
                            )
                            const title =
                                row.entityTitle ?? (row.entityId ? `#${row.entityId}` : "—")

                            return (
                                <div
                                    key={row.id}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm"
                                >
                                    <span className="font-medium text-ink shrink-0 w-32 truncate">
                                        {row.userName}
                                    </span>
                                    <span className="text-ink-secondary shrink-0">
                                        {ACTION_LABELS[row.action] ?? row.action}
                                    </span>
                                    <span className="text-ink-muted shrink-0">
                                        {ENTITY_LABELS[row.entityType] ?? row.entityType}:
                                    </span>
                                    <span className="flex-1 truncate">
                                        {href ? (
                                            <Link
                                                href={href}
                                                className="text-ink hover:underline underline-offset-2"
                                            >
                                                {title}
                                            </Link>
                                        ) : (
                                            <span className="text-ink-muted">{title}</span>
                                        )}
                                    </span>
                                    <span className="text-ink-muted shrink-0 text-xs">
                                        {row.createdAt.toLocaleString("ru-RU", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    <Pagination page={page} totalPages={totalPages} searchParams={filterParams} />
                </>
            )}
        </div>
    )
}
