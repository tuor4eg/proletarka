"use client"

import { useState } from "react"
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
import { GripVertical } from "lucide-react"
import { type MaterialType, type Status } from "@/db/schema"
import { PublishToggle } from "@/components/PublishToggle"
import { updateMaterialPositions } from "@/app/admin/artifacts/actions"

const TYPE_LABEL: Record<MaterialType, string> = {
    article: "Статья",
    photo: "Фото",
    document: "Документ",
}
const STATUS_LABEL: Record<Status, string> = { draft: "Черновик", published: "Опубл." }

type MaterialItem = {
    id: number
    title: string
    materialType: MaterialType
    status: Status
    position?: number | null
}

function SortableRow({ item, index }: { item: MaterialItem; index: number }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
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
            <span className="text-xs text-gray-300 w-5 shrink-0 text-right">{index + 1}</span>
            <Link
                href={`/admin/${item.id}`}
                className="flex items-center gap-3 py-2.5 flex-1 min-w-0"
            >
                <span className="text-sm font-medium flex-1 min-w-0 truncate">{item.title}</span>
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
    )
}

type Props = {
    initialItems: MaterialItem[]
}

export function SortableMaterialsList({ initialItems }: Props) {
    const [items, setItems] = useState(initialItems)

    const sensors = useSensors(useSensor(PointerSensor))

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        const reordered = arrayMove(items, oldIndex, newIndex)

        setItems(reordered)
        await updateMaterialPositions(reordered.map((item, index) => ({ id: item.id, position: index + 1 })))
    }

    return (
        <DndContext id="sortable-materials" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {items.map((item, index) => (
                        <SortableRow key={item.id} item={item} index={index} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}
