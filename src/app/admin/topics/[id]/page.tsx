import Link from "next/link"
import { notFound } from "next/navigation"
import { count, eq, isNull } from "drizzle-orm"
import { db } from "@/db"
import { topics } from "@/db/schema"
import { getTopicRelatedRecords } from "@/lib/adminTopics"
import { updateTopic, deleteTopic } from "../actions"
import { inputClass, Field } from "@/components/MaterialForm"
import { DeleteButton } from "@/components/DeleteButton"
import { SubmitButton } from "@/components/SubmitButton"
import { EditPageHeader } from "@/components/EditPageHeader"
import { CodeField } from "@/components/CodeField"
import { STATUS_LABEL, TYPE_LABEL } from "@/components/LinkedMaterialsList"

type Props = {
    params: Promise<{ id: string }>
    searchParams: Promise<{ eventPage?: string; materialPage?: string; entityPage?: string }>
}

const RELATED_PAGE_SIZE = 10

function getSafePage(value: string | undefined) {
    return Math.max(1, Number(value) || 1)
}

function plural(n: number, one: string, few: string, many: string) {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return one
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
    return many
}

function buildTopicPageHref(
    topicId: number,
    searchParams: Props["searchParams"] extends Promise<infer T> ? T : never,
    pageParam: "eventPage" | "materialPage" | "entityPage",
    page: number,
) {
    const params = new URLSearchParams()
    if (searchParams.eventPage && pageParam !== "eventPage") {
        params.set("eventPage", searchParams.eventPage)
    }
    if (searchParams.materialPage && pageParam !== "materialPage") {
        params.set("materialPage", searchParams.materialPage)
    }
    if (searchParams.entityPage && pageParam !== "entityPage") {
        params.set("entityPage", searchParams.entityPage)
    }
    if (page > 1) params.set(pageParam, String(page))

    const qs = params.toString()
    return `/admin/topics/${topicId}${qs ? `?${qs}` : ""}`
}

function SectionPagination({
    topicId,
    page,
    totalPages,
    searchParams,
    pageParam,
}: {
    topicId: number
    page: number
    totalPages: number
    searchParams: Props["searchParams"] extends Promise<infer T> ? T : never
    pageParam: "eventPage" | "materialPage" | "entityPage"
}) {
    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-end gap-1 px-4 py-2 bg-gray-50">
            {page > 1 ? (
                <Link
                    href={buildTopicPageHref(topicId, searchParams, pageParam, page - 1)}
                    className="px-2.5 py-1 text-xs rounded-lg hover:bg-white transition-colors"
                >
                    ←
                </Link>
            ) : (
                <span className="px-2.5 py-1 text-xs text-gray-300">←</span>
            )}
            <span className="px-2 text-xs text-gray-400">
                {page} / {totalPages}
            </span>
            {page < totalPages ? (
                <Link
                    href={buildTopicPageHref(topicId, searchParams, pageParam, page + 1)}
                    className="px-2.5 py-1 text-xs rounded-lg hover:bg-white transition-colors"
                >
                    →
                </Link>
            ) : (
                <span className="px-2.5 py-1 text-xs text-gray-300">→</span>
            )}
        </div>
    )
}

function EmptyRelatedState() {
    return <p className="px-4 py-3 text-sm text-gray-400">Связей пока нет.</p>
}

export default async function EditTopicPage({ params, searchParams }: Props) {
    const { id } = await params
    const usageParams = await searchParams
    const numericId = Number(id)
    const eventPage = getSafePage(usageParams.eventPage)
    const materialPage = getSafePage(usageParams.materialPage)
    const entityPage = getSafePage(usageParams.entityPage)

    if (!Number.isInteger(numericId) || numericId <= 0) {
        notFound()
    }

    const [topic, parentOptions, [{ childCount }]] = await Promise.all([
        db
            .select()
            .from(topics)
            .where(eq(topics.id, numericId))
            .limit(1)
            .then((rows) => rows[0]),
        db
            .select({ id: topics.id, title: topics.title })
            .from(topics)
            .where(isNull(topics.parentId))
            .orderBy(topics.title),
        db.select({ childCount: count() }).from(topics).where(eq(topics.parentId, numericId)),
    ])

    if (!topic) {
        notFound()
    }

    const action = updateTopic.bind(null, numericId)
    const deleteAction = deleteTopic.bind(null, numericId)
    const parentDisabled = childCount > 0 || topic.isSystem
    const deleteDisabled = topic.isSystem
    const {
        eventPeopleRows,
        eventPeopleTotal,
        eventPeopleTotalPages,
        materialRows,
        materialTotal,
        materialTotalPages,
        entityRows,
        entityTotal,
        entityTotalPages,
    } = await getTopicRelatedRecords(numericId, {
        eventPage,
        materialPage,
        entityPage,
        pageSize: RELATED_PAGE_SIZE,
    })

    return (
        <div className="py-6">
            <EditPageHeader />
            <h1 className="text-xl font-bold mb-6">Редактировать тему</h1>
            <form action={action} className="flex flex-col gap-4">
                <Field label="Название *">
                    <input
                        name="title"
                        type="text"
                        required
                        defaultValue={topic.title}
                        className={inputClass}
                    />
                </Field>
                <Field label="Родительская тема">
                    <select
                        name="parentId"
                        defaultValue={topic.parentId ?? ""}
                        disabled={parentDisabled}
                        className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}
                    >
                        <option value="">— без родителя —</option>
                        {parentOptions
                            .filter((option) => option.id !== topic.id)
                            .map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.title}
                                </option>
                            ))}
                    </select>
                    {topic.isSystem ? (
                        <p className="text-xs text-gray-400">
                            У системной темы нельзя менять родителя.
                        </p>
                    ) : childCount > 0 ? (
                        <p className="text-xs text-gray-400">
                            У этой темы уже есть подтемы, поэтому сделать ее подтемой нельзя.
                        </p>
                    ) : null}
                </Field>
                <CodeField code={topic.code} />
                <div className="flex items-center gap-3 mt-0">
                    <SubmitButton label="Сохранить" />
                    {!deleteDisabled && <DeleteButton action={deleteAction} />}
                </div>
            </form>

            <section className="mt-10">
                <div className="mb-3">
                    <h2 className="text-base font-semibold">Связанные записи</h2>
                    <p className="mt-1 text-xs text-gray-400">
                        Список только для просмотра: чтобы изменить тему, откройте связанную запись.
                    </p>
                </div>

                <div className="space-y-5">
                    <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-gray-700">
                                Люди по событиям
                            </h3>
                            <span className="text-xs text-gray-400">{eventPeopleTotal}</span>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
                            {eventPeopleRows.length === 0 ? (
                                <EmptyRelatedState />
                            ) : (
                                eventPeopleRows.map((row) => (
                                    <Link
                                        key={row.entityId}
                                        href={`/admin/people/${row.personCode}`}
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {row.personName}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Тема есть в событиях человека
                                            </p>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                            {row.eventCount}{" "}
                                            {plural(
                                                row.eventCount,
                                                "событие",
                                                "события",
                                                "событий",
                                            )}
                                        </span>
                                    </Link>
                                ))
                            )}
                            <SectionPagination
                                topicId={numericId}
                                page={eventPage}
                                totalPages={eventPeopleTotalPages}
                                searchParams={usageParams}
                                pageParam="eventPage"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-gray-700">Материалы</h3>
                            <span className="text-xs text-gray-400">{materialTotal}</span>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
                            {materialRows.length === 0 ? (
                                <EmptyRelatedState />
                            ) : (
                                materialRows.map((row) => (
                                    <Link
                                        key={row.id}
                                        href={`/admin/${row.id}`}
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {row.title}
                                            </p>
                                            {(row.personName || row.artifactTitle) && (
                                                <p className="truncate text-xs text-gray-400">
                                                    {row.personName
                                                        ? `Человек: ${row.personName}`
                                                        : `Объект: ${row.artifactTitle}`}
                                                </p>
                                            )}
                                        </div>
                                        <span className="shrink-0 text-xs text-gray-400">
                                            {TYPE_LABEL[row.materialType]}
                                        </span>
                                        <span
                                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                                                row.status === "published"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-500"
                                            }`}
                                        >
                                            {STATUS_LABEL[row.status]}
                                        </span>
                                    </Link>
                                ))
                            )}
                            <SectionPagination
                                topicId={numericId}
                                page={materialPage}
                                totalPages={materialTotalPages}
                                searchParams={usageParams}
                                pageParam="materialPage"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-gray-700">Карточки</h3>
                            <span className="text-xs text-gray-400">{entityTotal}</span>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
                            {entityRows.length === 0 ? (
                                <EmptyRelatedState />
                            ) : (
                                entityRows.map((row) => {
                                    const title =
                                        row.personName ?? row.artifactTitle ?? "Без названия"
                                    const href =
                                        row.entityType === "person" && row.personCode
                                            ? `/admin/people/${row.personCode}`
                                            : row.artifactCode
                                              ? `/admin/artifacts/${row.artifactCode}`
                                              : null

                                    const content = (
                                        <>
                                            <div className="flex-1 min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {title}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    Тема стоит на самой карточке
                                                </p>
                                            </div>
                                            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                                {row.entityType === "person" ? "Человек" : "Объект"}
                                            </span>
                                        </>
                                    )

                                    return href ? (
                                        <Link
                                            key={row.entityId}
                                            href={href}
                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                                        >
                                            {content}
                                        </Link>
                                    ) : (
                                        <div
                                            key={row.entityId}
                                            className="flex items-center gap-3 px-4 py-2.5"
                                        >
                                            {content}
                                        </div>
                                    )
                                })
                            )}
                            <SectionPagination
                                topicId={numericId}
                                page={entityPage}
                                totalPages={entityTotalPages}
                                searchParams={usageParams}
                                pageParam="entityPage"
                            />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
