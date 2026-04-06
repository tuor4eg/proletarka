import { db } from "@/db"
import { topics } from "@/db/schema"
import { createArtifact } from "../actions"
import { inputClass, Field } from "@/components/MaterialForm"
import { ImageUpload } from "@/components/ImageUpload"
import { SubmitButton } from "@/components/SubmitButton"
import { CodeField } from "@/components/CodeField"

export default async function NewArtifactPage() {
    const allTopics = await db.select({ id: topics.id, title: topics.title }).from(topics)

    return (
        <div className="py-6">
            <h1 className="text-xl font-bold mb-6">Новый исторический объект</h1>
            <form action={createArtifact} className="flex flex-col gap-4">
                <Field label="Название *">
                    <input name="title" type="text" required className={inputClass} />
                </Field>
                <Field label="Описание">
                    <textarea name="description" rows={4} className={inputClass} />
                </Field>
                <Field label="Период" hint="Например: «1941–1945» или «ок. 1943»">
                    <input name="yearsLabel" type="text" className={inputClass} />
                </Field>
                <div className="flex gap-3">
                    <Field label="Год от">
                        <input
                            name="yearFrom"
                            type="number"
                            min="1800"
                            max="2100"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Год до">
                        <input
                            name="yearTo"
                            type="number"
                            min="1800"
                            max="2100"
                            className={inputClass}
                        />
                    </Field>
                </div>
                {allTopics.length > 0 && (
                    <Field label="Темы">
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-0.5">
                            {allTopics.map((topic) => (
                                <label
                                    key={topic.id}
                                    className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        name="topicIds"
                                        value={topic.id}
                                        className="rounded"
                                    />
                                    {topic.title}
                                </label>
                            ))}
                        </div>
                    </Field>
                )}
                <Field label="Тип">
                    <select name="artifactType" className={inputClass}>
                        <option value="general">Обычный</option>
                        <option value="stand">Стенд</option>
                        <option value="rarity">Экспонат</option>
                        <option value="fund">Фонд</option>
                    </select>
                </Field>
                <ImageUpload
                    fileInputName="coverImageFile"
                    urlInputName="coverImagePath"
                    label="Обложка"
                />
                <CodeField />
                <SubmitButton label="Сохранить" className="mt-2" />
            </form>
        </div>
    )
}
