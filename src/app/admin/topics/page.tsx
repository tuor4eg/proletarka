import Link from "next/link"
import { CornerDownRight, FolderTree } from "lucide-react"
import { asc, count } from "drizzle-orm"
import { db } from "@/db"
import { topics } from "@/db/schema"
import { getTopicUsageCountsMap } from "@/lib/adminTopics"
import { deleteTopic } from "./actions"
import { DeleteButton } from "@/components/DeleteButton"
import { Pagination } from "@/components/Pagination"

const PAGE_SIZE = 20

type TopicListItem = {
    id: number
    title: string
    isSystem: boolean
    parentId: number | null
    materialCount: number
    eventCount: number
    entityCount: number
    usageCount: number
    children: TopicListItem[]
}

type SearchParams = Promise<{ page?: string }>

export default async function TopicsPage({ searchParams }: { searchParams: SearchParams }) {
    const { page: pageParam } = await searchParams
    const page = Math.max(1, Number(pageParam) || 1)

    const [topicRows, childCountRows, usageCountMap] = await Promise.all([
        db
            .select({
                id: topics.id,
                title: topics.title,
                isSystem: topics.isSystem,
                parentId: topics.parentId,
            })
            .from(topics)
            .orderBy(asc(topics.title)),
        db
            .select({ parentId: topics.parentId, total: count() })
            .from(topics)
            .groupBy(topics.parentId),
        getTopicUsageCountsMap(),
    ])
    const rows = topicRows.map((topic) => {
        const usageCounts = usageCountMap.get(topic.id)
        const materialCount = usageCounts?.materialCount ?? 0
        const eventCount = usageCounts?.eventCount ?? 0
        const entityCount = usageCounts?.entityCount ?? 0

        return {
            ...topic,
            materialCount,
            eventCount,
            entityCount,
            usageCount: usageCounts?.usageCount ?? 0,
        }
    })

    const childCountMap = new Map(
        childCountRows
            .filter((row) => row.parentId !== null)
            .map((row) => [row.parentId as number, row.total]),
    )

    const byId = new Map(
        rows.map((topic) => [
            topic.id,
            {
                ...topic,
                children: [] as TopicListItem[],
            },
        ]),
    )

    const roots: TopicListItem[] = []

    for (const topic of byId.values()) {
        if (topic.parentId === null) {
            roots.push(topic)
            continue
        }

        const parent = byId.get(topic.parentId)
        if (parent) {
            parent.children.push(topic)
        } else {
            roots.push(topic)
        }
    }

    roots.sort((a, b) => {
        if (a.isSystem !== b.isSystem) {
            return a.isSystem ? -1 : 1
        }

        return a.title.localeCompare(b.title, "ru")
    })

    const list = roots.flatMap((topic) => [topic, ...topic.children])
    const total = list.length
    const totalPages = Math.ceil(total / PAGE_SIZE)
    const paginatedList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
        <div className="py-6">
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-bold">Темы</h1>
                <Link
                    href="/admin/topics/new"
                    className="text-sm bg-black text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors"
                >
                    + Добавить
                </Link>
            </div>
            {list.length === 0 ? (
                <p className="text-sm text-gray-500">Тем пока нет.</p>
            ) : (
                <>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                        {paginatedList.map((topic) => {
                            const deleteAction = deleteTopic.bind(null, topic.id)
                            const hasChildren = (childCountMap.get(topic.id) ?? 0) > 0
                            const deleteDisabled =
                                topic.isSystem || topic.usageCount > 0 || hasChildren
                            const parentTitle =
                                topic.parentId !== null
                                    ? (byId.get(topic.parentId)?.title ?? null)
                                    : null
                            return (
                                <div
                                    key={topic.id}
                                    className={`flex items-center gap-3 px-4 py-2.5 ${
                                        topic.parentId !== null ? "pl-10 bg-gray-50/60" : ""
                                    }`}
                                >
                                    <Link
                                        href={`/admin/topics/${topic.id}`}
                                        className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-70 transition-opacity"
                                    >
                                        <div className="shrink-0 text-gray-400">
                                            {topic.parentId !== null ? (
                                                <CornerDownRight size={16} />
                                            ) : (
                                                <FolderTree size={16} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium flex-1 truncate block">
                                                {topic.title}
                                            </span>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                {topic.parentId !== null && parentTitle && (
                                                    <span className="text-[11px] bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">
                                                        {parentTitle}
                                                    </span>
                                                )}
                                                {topic.isSystem && (
                                                    <span className="text-[11px] text-gray-400 block">
                                                        Системная тема
                                                    </span>
                                                )}
                                                {topic.usageCount > 0 && (
                                                    <span className="text-[11px] text-gray-400 block">
                                                        {topic.eventCount > 0
                                                            ? `события: ${topic.eventCount}`
                                                            : ""}
                                                        {topic.materialCount > 0
                                                            ? `${topic.eventCount > 0 ? " · " : ""}материалы: ${topic.materialCount}`
                                                            : ""}
                                                        {topic.entityCount > 0
                                                            ? `${topic.eventCount > 0 || topic.materialCount > 0 ? " · " : ""}карточки: ${topic.entityCount}`
                                                            : ""}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                    <span className="text-xs text-gray-400 shrink-0 min-w-[3ch] text-right">
                                        {topic.usageCount > 0 ? topic.usageCount : ""}
                                    </span>
                                    {!topic.isSystem && (
                                        <DeleteButton
                                            action={deleteAction}
                                            icon
                                            disabled={deleteDisabled}
                                            disabledTooltip={
                                                topic.usageCount > 0
                                                    ? "Есть связанные записи"
                                                    : "Есть подтемы"
                                            }
                                        />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <Pagination page={page} totalPages={totalPages} searchParams={{}} />
                </>
            )}
        </div>
    )
}
