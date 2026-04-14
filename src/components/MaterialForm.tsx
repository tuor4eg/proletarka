"use client"

import { useState, useEffect, useRef, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Search, X } from "lucide-react"
import { toast } from "sonner"
import type { ActionResult } from "@/app/admin/actions"
import { InferSelectModel } from "drizzle-orm"
import { materials, type MaterialType, type Status, type EntityType } from "@/db/schema"
import { ImageUpload } from "@/components/ImageUpload"
import { DeleteButton } from "@/components/DeleteButton"
import { SourcesInput, type SourceInputItem } from "@/components/SourcesInput"

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

export type PersonOption = {
    id: number
    name: string
}

export const STATUSES = [
    { value: "draft", label: "Черновик" },
    { value: "published", label: "Опубликовано" },
] as const

export const MATERIAL_TYPES = [
    { value: "article", label: "Статья" },
    { value: "news", label: "Новость" },
    { value: "photo", label: "Фото" },
    { value: "group_photo", label: "Групповое фото" },
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
    people?: PersonOption[]
    selectedTopicIds?: number[]
    selectedPersonIds?: number[]
    defaultEntityId?: number
    defaultMaterialType?: MaterialType
    materialTypeLocked?: boolean
    defaultSectionId?: number
    backstack?: string
    initialSources?: SourceInputItem[]
}

function FormActions({
    deleteAction,
    deleteConfirmBody,
    saveDisabled = false,
    saveLabel = "Сохранить",
}: {
    deleteAction?: () => Promise<void>
    deleteConfirmBody?: string
    saveDisabled?: boolean
    saveLabel?: string
}) {
    const { pending } = useFormStatus()
    return (
        <div className="flex items-center gap-3 mt-5">
            <button
                type="submit"
                disabled={pending || saveDisabled}
                className="bg-black text-white text-sm font-medium rounded-xl px-5 py-2.5 hover:bg-gray-800 disabled:opacity-60 transition-colors"
            >
                {pending ? "Сохранение…" : saveLabel}
            </button>
            {deleteAction && <DeleteButton action={deleteAction} confirmBody={deleteConfirmBody} />}
        </div>
    )
}

function PeopleMultiSelect({
    people,
    selectedIds,
    onChange,
}: {
    people: PersonOption[]
    selectedIds: number[]
    onChange: (personIds: number[]) => void
}) {
    const [query, setQuery] = useState("")
    const [knownPeople, setKnownPeople] = useState<PersonOption[]>(people)
    const [results, setResults] = useState<PersonOption[]>([])
    const [searching, setSearching] = useState(false)

    useEffect(() => {
        setKnownPeople((current) => {
            const merged = new Map(current.map((person) => [person.id, person]))
            for (const person of people) {
                merged.set(person.id, person)
            }
            return Array.from(merged.values())
        })
    }, [people])

    useEffect(() => {
        const normalizedQuery = query.trim()
        if (normalizedQuery.length < 2) {
            setResults([])
            setSearching(false)
            return
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(async () => {
            setSearching(true)
            try {
                const params = new URLSearchParams({ q: normalizedQuery })
                const response = await fetch(`/api/admin/people/search?${params}`, {
                    signal: controller.signal,
                })
                if (!response.ok) {
                    setResults([])
                    return
                }

                const data = (await response.json()) as PersonOption[]
                setResults(data.filter((person) => !selectedIds.includes(person.id)))
                setKnownPeople((current) => {
                    const merged = new Map(current.map((person) => [person.id, person]))
                    for (const person of data) {
                        merged.set(person.id, person)
                    }
                    return Array.from(merged.values())
                })
            } catch {
                setResults([])
            } finally {
                setSearching(false)
            }
        }, 250)

        return () => {
            controller.abort()
            clearTimeout(timeoutId)
        }
    }, [query, selectedIds])

    const selectedPeople = selectedIds
        .map((id) => knownPeople.find((person) => person.id === id))
        .filter((person): person is PersonOption => Boolean(person))

    function addPerson(personId: number) {
        onChange(selectedIds.includes(personId) ? selectedIds : [...selectedIds, personId])
        setQuery("")
        setResults([])
    }

    function removePerson(personId: number) {
        onChange(selectedIds.filter((id) => id !== personId))
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="relative">
                <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Начните вводить имя человека…"
                    className="w-full rounded-xl border border-gray-200 pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                />
            </div>

            {selectedPeople.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedPeople.map((person) => (
                        <span
                            key={person.id}
                            className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                        >
                            {person.name}
                            <button
                                type="button"
                                onClick={() => removePerson(person.id)}
                                className="rounded-full text-gray-400 hover:text-gray-700 transition-colors"
                                aria-label={`Убрать ${person.name}`}
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {query.trim().length >= 2 && (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                    {searching ? (
                        <p className="px-3 py-2 text-sm text-gray-400">Поиск…</p>
                    ) : results.length > 0 ? (
                        results.map((person) => (
                            <button
                                key={person.id}
                                type="button"
                                onClick={() => addPerson(person.id)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                            >
                                {person.name}
                            </button>
                        ))
                    ) : (
                        <p className="px-3 py-2 text-sm text-gray-400">Ничего не найдено.</p>
                    )}
                </div>
            )}

            {selectedIds.map((personId) => (
                <input key={personId} type="hidden" name="personIds" value={personId} />
            ))}
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
    people = [],
    selectedTopicIds = [],
    selectedPersonIds = [],
    defaultEntityId,
    defaultMaterialType,
    materialTypeLocked = false,
    defaultSectionId,
    backstack,
    initialSources = [],
}: Props) {
    const [state, formAction] = useActionState(action, null)
    const formRef = useRef<HTMLFormElement>(null)
    const isEditing = Boolean(material)
    const [status, setStatus] = useState<Status>(material?.status ?? "published")
    const [materialType, setMaterialType] = useState<MaterialType>(
        material?.materialType ?? defaultMaterialType ?? "article",
    )
    const [groupPhotoPersonIds, setGroupPhotoPersonIds] = useState<number[]>(selectedPersonIds)
    const isNews = materialType === "news"
    const isGroupPhoto = materialType === "group_photo"
    const groupPhotoNeedsMorePeople = isGroupPhoto && groupPhotoPersonIds.length < 2

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
                {backstack && <input type="hidden" name="backstack" value={backstack} />}
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

                    <Field label="Внешние источники">
                        <SourcesInput initialSources={initialSources} />
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
                        {materialTypeLocked && (
                            <input type="hidden" name="materialType" value={materialType} />
                        )}
                        <select
                            name="materialType"
                            required
                            value={materialType}
                            onChange={(e) => setMaterialType(e.target.value as MaterialType)}
                            disabled={materialTypeLocked}
                            className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}
                        >
                            {MATERIAL_TYPES.map(({ value, label }) => (
                                <option
                                    key={value}
                                    value={value}
                                    disabled={
                                        isEditing &&
                                        material?.materialType !== "news" &&
                                        material?.materialType !== "group_photo" &&
                                        (value === "news" || value === "group_photo")
                                    }
                                >
                                    {label}
                                </option>
                            ))}
                        </select>
                    </Field>

                    {!isNews && !isGroupPhoto && (
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
                        </>
                    )}

                    {defaultSectionId && (
                        <input type="hidden" name="sectionId" value={defaultSectionId} />
                    )}

                    {!isNews && topics.length > 0 && (
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
                                            defaultChecked={selectedTopicIds.includes(topic.id)}
                                            className="rounded"
                                        />
                                        {topic.title}
                                    </label>
                                ))}
                            </div>
                        </Field>
                    )}

                    {!isNews && (
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
                    )}

                    {isGroupPhoto && (
                        <>
                            <input type="hidden" name="entityId" value="" />
                            {defaultSectionId && (
                                <input type="hidden" name="sectionId" value={defaultSectionId} />
                            )}

                            <Field
                                label="Люди на фото"
                                hint="Найдите и добавьте минимум двух человек."
                            >
                                <PeopleMultiSelect
                                    people={people}
                                    selectedIds={groupPhotoPersonIds}
                                    onChange={setGroupPhotoPersonIds}
                                />
                            </Field>
                        </>
                    )}
                </div>

                <FormActions
                    deleteAction={deleteAction}
                    deleteConfirmBody={deleteConfirmBody}
                    saveDisabled={groupPhotoNeedsMorePeople}
                    saveLabel={
                        groupPhotoNeedsMorePeople ? "Выберите минимум двух человек" : "Сохранить"
                    }
                />
            </form>
        </>
    )
}
