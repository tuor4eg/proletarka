import { isNull } from "drizzle-orm"
import { db } from "@/db"
import { topics } from "@/db/schema"
import { createTopic } from "../actions"
import { inputClass, Field } from "@/components/MaterialForm"
import { SubmitButton } from "@/components/SubmitButton"
import { CodeField } from "@/components/CodeField"

export default async function NewTopicPage() {
    const parentOptions = await db
        .select({ id: topics.id, title: topics.title })
        .from(topics)
        .where(isNull(topics.parentId))
        .orderBy(topics.title)

    return (
        <div className="py-6">
            <h1 className="text-xl font-bold mb-6">Новая тема</h1>
            <form action={createTopic} className="flex flex-col gap-4">
                <Field label="Название *">
                    <input name="title" type="text" required className={inputClass} />
                </Field>
                <Field label="Родительская тема">
                    <select name="parentId" defaultValue="" className={inputClass}>
                        <option value="">— без родителя —</option>
                        {parentOptions.map((topic) => (
                            <option key={topic.id} value={topic.id}>
                                {topic.title}
                            </option>
                        ))}
                    </select>
                </Field>
                <CodeField />
                <SubmitButton label="Сохранить" className="mt-2" />
            </form>
        </div>
    )
}
