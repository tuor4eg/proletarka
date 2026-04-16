import { notFound } from "next/navigation"
import { count, eq, isNull } from "drizzle-orm"
import { db } from "@/db"
import { topics } from "@/db/schema"
import { updateTopic, deleteTopic } from "../actions"
import { inputClass, Field } from "@/components/MaterialForm"
import { DeleteButton } from "@/components/DeleteButton"
import { SubmitButton } from "@/components/SubmitButton"
import { EditPageHeader } from "@/components/EditPageHeader"
import { CodeField } from "@/components/CodeField"

type Props = {
    params: Promise<{ id: string }>
}

export default async function EditTopicPage({ params }: Props) {
    const { id } = await params
    const numericId = Number(id)

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
        </div>
    )
}
