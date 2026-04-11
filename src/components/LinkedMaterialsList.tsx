import Link from "next/link"
import { type MaterialType, type Status } from "@/db/schema"
import { PublishToggle } from "@/components/PublishToggle"
import { SortableMaterialsList, type MaterialItem } from "@/components/SortableMaterialsList"
import { appendBackstackParam } from "@/lib/adminBackstack"

export const TYPE_LABEL: Record<MaterialType, string> = {
    article: "Статья",
    news: "Новость",
    photo: "Фото",
    group_photo: "Групповое фото",
    document: "Документ",
}
export const STATUS_LABEL: Record<Status, string> = { draft: "Черновик", published: "Опубл." }

type Props = {
    entityId: number
    materials: MaterialItem[]
    addHref: string
    showPosition?: boolean
    itemBackstack?: string
}

export function LinkedMaterialsList({
    entityId: _entityId,
    materials,
    addHref,
    showPosition = false,
    itemBackstack,
}: Props) {
    return (
        <div className="mt-10">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">Материалы</h2>
                <Link
                    href={addHref}
                    className="text-sm bg-black text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors"
                >
                    + Добавить материал
                </Link>
            </div>
            {materials.length === 0 ? (
                <p className="text-sm text-gray-400">Материалов пока нет.</p>
            ) : showPosition ? (
                <SortableMaterialsList initialItems={materials} itemBackstack={itemBackstack} />
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {materials.map((m) => (
                        <div
                            key={m.id}
                            className="flex items-center gap-2 px-4 hover:bg-gray-50 transition-colors"
                        >
                            <Link
                                href={appendBackstackParam(`/admin/${m.id}`, itemBackstack)}
                                className="flex items-center gap-3 py-2.5 flex-1 min-w-0"
                            >
                                <span className="text-sm font-medium flex-1 min-w-0 truncate">
                                    {m.title}
                                </span>
                                <span className="text-xs text-gray-400 shrink-0">
                                    {TYPE_LABEL[m.materialType]}
                                </span>
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                                        m.status === "published"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-500"
                                    }`}
                                >
                                    {STATUS_LABEL[m.status]}
                                </span>
                            </Link>
                            <PublishToggle id={m.id} status={m.status} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
