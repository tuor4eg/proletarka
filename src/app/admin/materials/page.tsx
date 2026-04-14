import Link from "next/link"
import { desc, asc, ilike, eq, and, count, inArray } from "drizzle-orm"
import { db } from "@/db"
import {
    materials,
    entities,
    people,
    artifacts,
    personMaterials,
    type MaterialType,
    type Status,
} from "@/db/schema"
import { AdminFilters } from "@/components/AdminFilters"
import { PublishToggle } from "@/components/PublishToggle"
import { Pagination } from "@/components/Pagination"
import { TYPE_LABEL, STATUS_LABEL } from "@/components/LinkedMaterialsList"
import { Suspense } from "react"
import { buildBackstackHref, parseBackstack, pushBackstack } from "@/lib/adminBackstack"
const PAGE_SIZE = 20

const TYPE_TITLES: Record<MaterialType, string> = {
    article: "Статьи",
    news: "Новости",
    photo: "Фото",
    group_photo: "Групповые фото",
    document: "Документы",
}

type SearchParams = Promise<{
    q?: string
    status?: Status
    type?: MaterialType
    sort?: string
    page?: string
    backstack?: string
}>

export default async function AdminMaterialsPage({ searchParams }: { searchParams: SearchParams }) {
    const { q, status, type, sort = "date_desc", page: pageParam, backstack } = await searchParams
    const page = Math.max(1, Number(pageParam) || 1)
    const currentParams = new URLSearchParams()
    const currentBackstack = parseBackstack(backstack)

    if (q) currentParams.set("q", q)
    if (status) currentParams.set("status", status)
    if (type) currentParams.set("type", type)
    if (sort) currentParams.set("sort", sort)
    if (page > 1) currentParams.set("page", String(page))

    const currentUrl = `/admin/materials${currentParams.toString() ? `?${currentParams.toString()}` : ""}`
    const nextBackstack = pushBackstack(currentBackstack, currentUrl)

    const conditions = [
        q ? ilike(materials.title, `%${q}%`) : undefined,
        status ? eq(materials.status, status) : undefined,
        type ? eq(materials.materialType, type) : undefined,
    ].filter(Boolean) as Parameters<typeof and>

    const where = conditions.length ? and(...conditions) : undefined

    const orderBy =
        sort === "date_asc"
            ? asc(materials.createdAt)
            : sort === "title_asc"
              ? asc(materials.title)
              : sort === "title_desc"
                ? desc(materials.title)
                : desc(materials.createdAt)

    const [items, [{ total }], allItems] = await Promise.all([
        db
            .select({
                material: materials,
                entityType: entities.type,
                personName: people.name,
                artifactTitle: artifacts.title,
            })
            .from(materials)
            .leftJoin(entities, eq(materials.entityId, entities.id))
            .leftJoin(people, eq(entities.personId, people.id))
            .leftJoin(artifacts, eq(entities.artifactId, artifacts.id))
            .where(where)
            .orderBy(orderBy)
            .limit(PAGE_SIZE)
            .offset((page - 1) * PAGE_SIZE),
        db.select({ total: count() }).from(materials).where(where),
        db
            .select({ status: materials.status })
            .from(materials)
            .where(type ? eq(materials.materialType, type) : undefined),
    ])

    const groupPhotoIds = items
        .filter(({ material }) => material.materialType === "group_photo")
        .map(({ material }) => material.id)

    const linkedPeopleRows = groupPhotoIds.length
        ? await db
              .select({
                  materialId: personMaterials.materialId,
                  personName: people.name,
              })
              .from(personMaterials)
              .innerJoin(people, eq(personMaterials.personId, people.id))
              .where(inArray(personMaterials.materialId, groupPhotoIds))
              .orderBy(asc(people.name))
        : []

    const linkedPeopleByMaterialId = new Map<number, string[]>()
    for (const row of linkedPeopleRows) {
        const current = linkedPeopleByMaterialId.get(row.materialId) ?? []
        if (!current.includes(row.personName)) {
            current.push(row.personName)
        }
        linkedPeopleByMaterialId.set(row.materialId, current)
    }

    const enrichedItems = items.map(({ material, entityType, personName, artifactTitle }) => ({
        ...material,
        relationLabel:
            entityType === "person" && personName
                ? `Человек: ${personName}`
                : entityType === "artifact" && artifactTitle
                  ? `Объект: ${artifactTitle}`
                  : null,
        linkedPeople: linkedPeopleByMaterialId.get(material.id) ?? [],
    }))

    const totalPages = Math.ceil(total / PAGE_SIZE)
    const published = allItems.filter((i) => i.status === "published").length
    const drafts = allItems.filter((i) => i.status === "draft").length
    const pageTitle = type ? TYPE_TITLES[type] : "Материалы"
    const addHref = type ? `/admin/new?materialType=${type}` : "/admin/new"

    return (
        <div className="py-6">
            <div className="flex items-center justify-between mb-1">
                <h1 className="text-xl font-bold">{pageTitle}</h1>
                <Link
                    href={addHref}
                    className="text-sm bg-black text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors"
                >
                    + Добавить
                </Link>
            </div>
            <p className="text-xs text-gray-400 mb-5">
                {allItems.length} всего · {published} опубликовано · {drafts} черновиков
            </p>
            <Suspense>
                <AdminFilters q={q ?? ""} status={status ?? ""} sort={sort} showStatus />
            </Suspense>
            {items.length === 0 ? (
                <p className="text-sm text-gray-500">Ничего не найдено.</p>
            ) : (
                <>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                        {enrichedItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-2 px-4 hover:bg-gray-50 transition-colors"
                            >
                                <Link
                                    href={buildBackstackHref(`/admin/${item.id}`, nextBackstack)}
                                    className="flex items-center gap-3 py-2.5 flex-1 min-w-0"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">
                                            {item.title}
                                        </div>
                                        {(item.relationLabel ||
                                            (item.materialType === "group_photo" &&
                                                item.linkedPeople.length > 0)) && (
                                            <div className="text-xs text-gray-400 truncate">
                                                {item.materialType === "group_photo" &&
                                                item.linkedPeople.length > 0
                                                    ? `На фото: ${item.linkedPeople.join(", ")}`
                                                    : item.relationLabel}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-400 shrink-0">
                                        {TYPE_LABEL[item.materialType]}
                                    </span>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                                            item.status === "published"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-100 text-gray-500"
                                        }`}
                                    >
                                        {STATUS_LABEL[item.status]}
                                    </span>
                                </Link>
                                <PublishToggle id={item.id} status={item.status} />
                            </div>
                        ))}
                    </div>
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        searchParams={{ q, status, type, sort }}
                    />
                </>
            )}
        </div>
    )
}
