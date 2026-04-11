"use client"

import { useState, useEffect, useRef, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"
import type { ActionResult } from "@/app/admin/actions"
import { InferSelectModel } from "drizzle-orm"
import { materials, type MaterialType, type Status, type EntityType } from "@/db/schema"
import { ImageUpload } from "@/components/ImageUpload"
import { DeleteButton } from "@/components/DeleteButton"

type Material = InferSelectModel<typeof materials>

export type EntityOption = {
    id: number
    type: EntityType
    displayName: string
}

export type TopicOption = {
    id: number
    title: string
}

export const STATUSES = [
    { value: "draft", label: "Черновик" },
    { value: "published", label: "Опубликовано" },
] as const

export const MATERIAL_TYPES = [
    { value: "article", label: "Статья" },
    { value: "news", label: "Новость" },
    { value: "photo", label: "Фото" },
    { value: "document", label: "Документ" },
] as const

const ENTITY_TYPES = [
    { value: "person", label: "Человек" },
    { value: "artifact", label: "Исторический объект" },
] as const

export const inputClass =
    "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"

export function Field({
    label,
    hint,
    children,
}: {
    label: string
    hint?: string
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {label}
            </label>
            {hint && <p className="text-xs text-gray-400">{hint}</p>}
            {children}
        </div>
    )
}

type Props = {
    action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
    deleteAction?: () => Promise<void>
    deleteConfirmBody?: string
    material?: Material
    entities: EntityOption[]
    topics: TopicOption[]
    selectedTopicIds?: number[]
    defaultEntityId?: number
    defaultMaterialType?: MaterialType
    defaultSectionId?: number
}

function FormActions({
    deleteAction,
    deleteConfirmBody,
}: {
    deleteAction?: () => Promise<void>
    deleteConfirmBody?: string
}) {
    const { pending } = useFormStatus()
    return (
        <div className="flex items-center gap-3 mt-5">
            <button
                type="submit"
                disabled={pending}
                className="bg-black text-white text-sm font-medium rounded-xl px-5 py-2.5 hover:bg-gray-800 disabled:opacity-60 transition-colors"
            >
                {pending ? "Сохранение…" : "Сохранить"}
            </button>
            {deleteAction && <DeleteButton action={deleteAction} confirmBody={deleteConfirmBody} />}
        </div>
    )
}

export function MaterialForm({
    action,
    deleteAction,
    deleteConfirmBody,
    material,
    entities,
    topics,
    selectedTopicIds = [],
    defaultEntityId,
    defaultMaterialType,
    defaultSectionId,
}: Props) {
    const [state, formAction] = useActionState(action, null)
    const formRef = useRef<HTMLFormElement>(null)
    const [status, setStatus] = useState<Status>(material?.status ?? "published")
    const [materialType, setMaterialType] = useState<MaterialType>(
        material?.materialType ?? defaultMaterialType ?? "article",
    )
    const isNews = materialType === "news"

    // Prevent React 19's automatic form.reset() after action — we want edit forms to keep their values
    useEffect(() => {
        const form = formRef.current
        if (!form) return
        const prevent = (e: Event) => e.preventDefault()
        form.addEventListener("reset", prevent)
        return () => form.removeEventListener("reset", prevent)
    }, [])

    // After successful save, sync controlled fields from returned values and show toast
    useEffect(() => {
        if (!state) return
        if (state.type === "error") {
            toast.error(state.message)
            return
        }
        toast.success(state.message)
        if (state.status) setStatus(state.status as Status)
        if (state.materialType) setMaterialType(state.materialType as MaterialType)
    }, [state])

    const initialEntityId = material?.entityId ?? defaultEntityId
    const initialEntity = initialEntityId
        ? (entities.find((e) => e.id === initialEntityId) ?? null)
        : null
    const entityTypeLocked = initialEntity !== null

    const [entityType, setEntityType] = useState<EntityType | "">(initialEntity?.type ?? "")
    const [entityId, setEntityId] = useState<string>(initialEntityId?.toString() ?? "")

    const filteredEntities = entities.filter((e) => e.type === entityType)

    function handleEntityTypeChange(value: EntityType | "") {
        setEntityType(value)
        setEntityId("")
    }

    return (
        <>
            <form
                ref={formRef}
                action={formAction}
                className="grid grid-cols-[1fr_240px] gap-5 items-start w-full"
            >
                {/* Left: main content */}
                <div className="flex flex-col gap-4">
                    <Field label="Заголовок *">
                        <input
                            name="title"
                            type="text"
                            required
                            defaultValue={material?.title ?? ""}
                            className={inputClass}
                        />
                    </Field>

                    {!isNews && (
                        <Field label="Краткое описание">
                            <textarea
                                name="summary"
                                rows={2}
                                defaultValue={material?.summary ?? ""}
                                className={inputClass}
                            />
                        </Field>
                    )}

                    <Field label="Текст">
                        <textarea
                            name="content"
                            rows={10}
                            defaultValue={material?.content ?? ""}
                            className={inputClass}
                        />
                    </Field>

                    <ImageUpload
                        fileInputName="coverImageFile"
                        urlInputName="coverImagePath"
                        defaultUrl={material?.coverImagePath}
                        label="Обложка"
                    />

                    <Field label="Ссылка на источник">
                        <input
                            name="sourceUrl"
                            type="url"
                            defaultValue={material?.sourceUrl ?? ""}
                            className={inputClass}
                        />
                    </Field>
                </div>

                {/* Right: meta sidebar */}
                <div className="flex flex-col gap-3 bg-white border border-gray-200 rounded-xl p-4">
                    <Field label="Статус">
                        <select
                            name="status"
                            required
                            value={status}
                            onChange={(e) => setStatus(e.target.value as Status)}
                            className={inputClass}
                        >
                            {STATUSES.map(({ value, label }) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Тип *">
                        <select
                            name="materialType"
                            required
                            value={materialType}
                            onChange={(e) => setMaterialType(e.target.value as MaterialType)}
                            className={inputClass}
                        >
                            {MATERIAL_TYPES.map(({ value, label }) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </Field>

                    {!isNews && (
                        <>
                            <Field label="Тип карточки">
                                <select
                                    value={entityType}
                                    onChange={(e) =>
                                        handleEntityTypeChange(e.target.value as EntityType | "")
                                    }
                                    disabled={entityTypeLocked}
                                    className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}
                                >
                                    <option value="">— без карточки —</option>
                                    {ENTITY_TYPES.map(({ value, label }) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            {entityType && (
                                <Field label="Карточка">
                                    <select
                                        name="entityId"
                                        value={entityId}
                                        onChange={(e) => setEntityId(e.target.value)}
                                        required
                                        className={inputClass}
                                    >
                                        <option value="">— выбрать —</option>
                                        {filteredEntities.map((entity) => (
                                            <option key={entity.id} value={entity.id}>
                                                {entity.displayName}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            )}

                            {!entityType && <input type="hidden" name="entityId" value="" />}
                            {defaultSectionId && (
                                <input type="hidden" name="sectionId" value={defaultSectionId} />
                            )}

                            {topics.length > 0 && (
                                <Field label="Темы">
                                    <div className="flex flex-col gap-1.5 pt-0.5">
                                        {topics.map((topic) => (
                                            <label
                                                key={topic.id}
                                                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    name="topicIds"
                                                    value={topic.id}
                                                    defaultChecked={selectedTopicIds.includes(
                                                        topic.id,
                                                    )}
                                                    className="rounded"
                                                />
                                                {topic.title}
                                            </label>
                                        ))}
                                    </div>
                                </Field>
                            )}

                            <div className="flex gap-2">
                                <Field label="Год (от)">
                                    <input
                                        name="yearFrom"
                                        type="number"
                                        min={1800}
                                        max={2100}
                                        defaultValue={material?.yearFrom ?? ""}
                                        className={inputClass}
                                    />
                                </Field>
                                <Field label="Год (до)">
                                    <input
                                        name="yearTo"
                                        type="number"
                                        min={1800}
                                        max={2100}
                                        defaultValue={material?.yearTo ?? ""}
                                        className={inputClass}
                                    />
                                </Field>
                            </div>
                        </>
                    )}
                </div>

                <FormActions deleteAction={deleteAction} deleteConfirmBody={deleteConfirmBody} />
            </form>
        </>
    )
}
