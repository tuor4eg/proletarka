"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core"
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Link2 } from "lucide-react"
import { type MaterialType, type Status } from "@/db/schema"
import { PublishToggle } from "@/components/PublishToggle"
import {
    updateMaterialPositions,
    updateMaterialSection,
    updateLinkedMaterialPositions,
    updateLinkedMaterialSection,
} from "@/app/admin/artifacts/actions"

const TYPE_LABEL: Record<MaterialType, string> = {
    article: "Статья",
    photo: "Фото",
    document: "Документ",
}
const STATUS_LABEL: Record<Status, string> = { draft: "Черновик", published: "Опубл." }

export type MaterialItem = {
    id: number
    title: string
    materialType: MaterialType
    status: Status
    position?: number | null
    sectionId?: number | null
}

export type LinkedItem = {
    id: number
    title: string
    materialType: MaterialType
    status: Status
    position?: number | null
    sectionId?: number | null
    personName?: string | null
    unlinkAction: () => Promise<void>
}

export type SectionOption = {
    id: number
    title: string
}

type AnyItem = {
    dndId: string
    id: number
    isLinked: boolean
    title: string
    materialType: MaterialType
    status: Status
    position?: number | null
    sectionId?: number | null
    personName?: string | null
    unlinkAction?: () => Promise<void>
}

function toAnyItems(native: MaterialItem[], linked: LinkedItem[]): AnyItem[] {
    const all: AnyItem[] = [
        ...native.map((item) => ({
            dndId: `n-${item.id}`,
            id: item.id,
            isLinked: false as const,
            title: item.title,
            materialType: item.materialType,
            status: item.status,
            position: item.position,
            sectionId: item.sectionId,
            personName: null,
            unlinkAction: undefined,
        })),
        ...linked.map((item) => ({
            dndId: `l-${item.id}`,
            id: item.id,
            isLinked: true as const,
            title: item.title,
            materialType: item.materialType,
            status: item.status,
            position: item.position,
            sectionId: item.sectionId,
            personName: item.personName,
            unlinkAction: item.unlinkAction,
        })),
    ]
    return all.sort(
        (a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER),
    )
}

function SortableRow({
    item,
    sections,
    onSectionChange,
    onLinkedSectionChange,
    sectionChangePending,
}: {
    item: AnyItem
    sections?: SectionOption[]
    onSectionChange?: (id: number, sectionId: number | null) => void
    onLinkedSectionChange?: (id: number, sectionId: number | null) => void
    sectionChangePending?: boolean
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.dndId,
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 px-4 hover:bg-gray-50 transition-colors bg-white"
        >
            <button
                type="button"
                {...attributes}
                {...listeners}
                className="text-gray-300 hover:text-gray-500 shrink-0 cursor-grab active:cursor-grabbing"
            >
                <GripVertical size={16} />
            </button>

            {item.isLinked ? (
                <>
                    <Link2 size={12} className="text-gray-300 shrink-0 -ml-1" />
                    <Link
                        href={`/admin/${item.id}`}
                        className="flex items-center gap-3 py-2.5 flex-1 min-w-0"
                    >
                        <span className="text-sm font-medium flex-1 min-w-0 truncate">
                            {item.title}
                        </span>
                        {item.personName && (
                            <span className="text-xs text-gray-400 shrink-0 max-w-[100px] truncate">
                                {item.personName}
                            </span>
                        )}
                        <span className="text-xs text-gray-400 shrink-0">
                            {TYPE_LABEL[item.materialType]}
                        </span>
                        <span
                            className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${item.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                        >
                            {STATUS_LABEL[item.status]}
                        </span>
                    </Link>
                    {sections && onLinkedSectionChange && (
                        <select
                            defaultValue={item.sectionId ?? ""}
                            disabled={sectionChangePending}
                            onChange={(e) =>
                                onLinkedSectionChange(
                                    item.id,
                                    e.target.value ? Number(e.target.value) : null,
                                )
                            }
                            className="text-xs text-gray-500 border border-gray-200 rounded-lg px-1.5 py-1 shrink-0 disabled:opacity-40"
                        >
                            <option value="">Без раздела</option>
                            {sections.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.title}
                                </option>
                            ))}
                        </select>
                    )}
                    {item.unlinkAction && (
                        <form action={item.unlinkAction}>
                            <button
                                type="submit"
                                className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0"
                            >
                                Отвязать
                            </button>
                        </form>
                    )}
                </>
            ) : (
                <>
                    <Link
                        href={`/admin/${item.id}`}
                        className="flex items-center gap-3 py-2.5 flex-1 min-w-0"
                    >
                        <span className="text-sm font-medium flex-1 min-w-0 truncate">
                            {item.title}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">
                            {TYPE_LABEL[item.materialType]}
                        </span>
                        <span
                            className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${item.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                        >
                            {STATUS_LABEL[item.status]}
                        </span>
                    </Link>
                    {sections && onSectionChange && (
                        <select
                            defaultValue={item.sectionId ?? ""}
                            disabled={sectionChangePending}
                            onChange={(e) =>
                                onSectionChange(
                                    item.id,
                                    e.target.value ? Number(e.target.value) : null,
                                )
                            }
                            className="text-xs text-gray-500 border border-gray-200 rounded-lg px-1.5 py-1 shrink-0 disabled:opacity-40"
                        >
                            <option value="">Без раздела</option>
                            {sections.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.title}
                                </option>
                            ))}
                        </select>
                    )}
                    <PublishToggle id={item.id} status={item.status} />
                </>
            )}
        </div>
    )
}

type Props = {
    initialItems: MaterialItem[]
    sections?: SectionOption[]
    linkedItems?: LinkedItem[]
    artifactId?: number
}

export function SortableMaterialsList({
    initialItems,
    sections,
    linkedItems = [],
    artifactId,
}: Props) {
    const [items, setItems] = useState(() => toAnyItems(initialItems, linkedItems))
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const linkedItemsKey = linkedItems
        .map((i) => `${i.id}:${i.position ?? ""}:${i.status}`)
        .join("|")

    useEffect(() => {
        setItems(toAnyItems(initialItems, linkedItems))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialItems, linkedItemsKey])

    const sensors = useSensors(useSensor(PointerSensor))

    function handleSectionChange(id: number, sectionId: number | null) {
        startTransition(async () => {
            await updateMaterialSection(id, sectionId)
            router.refresh()
        })
    }

    function handleLinkedSectionChange(materialId: number, sectionId: number | null) {
        if (!artifactId) return
        startTransition(async () => {
            await updateLinkedMaterialSection(artifactId, materialId, sectionId)
            router.refresh()
        })
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = items.findIndex((i) => i.dndId === active.id)
        const newIndex = items.findIndex((i) => i.dndId === over.id)
        const reordered = arrayMove(items, oldIndex, newIndex)
        setItems(reordered)

        const positioned = reordered.map((item, i) => ({ ...item, position: i + 1 }))

        const nativeUpdates = positioned
            .filter((i) => !i.isLinked)
            .map((i) => ({ id: i.id, position: i.position }))
        const linkedUpdates = positioned
            .filter((i) => i.isLinked)
            .map((i) => ({ materialId: i.id, position: i.position }))

        if (nativeUpdates.length > 0) await updateMaterialPositions(nativeUpdates)
        if (linkedUpdates.length > 0 && artifactId) {
            await updateLinkedMaterialPositions(artifactId, linkedUpdates)
        }
    }

    return (
        <DndContext
            id="sortable-materials"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items.map((i) => i.dndId)}
                strategy={verticalListSortingStrategy}
            >
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {items.map((item) => (
                        <SortableRow
                            key={item.dndId}
                            item={item}
                            sections={sections}
                            onSectionChange={handleSectionChange}
                            onLinkedSectionChange={handleLinkedSectionChange}
                            sectionChangePending={isPending}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}
