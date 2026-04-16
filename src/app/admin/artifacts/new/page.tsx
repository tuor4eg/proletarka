import { type ArtifactType } from "@/db/schema"
import { createArtifact } from "../actions"
import { inputClass, Field } from "@/components/MaterialForm"
import { TopicTreePicker } from "@/components/TopicTreePicker"
import { ImageUpload } from "@/components/ImageUpload"
import { SubmitButton } from "@/components/SubmitButton"
import { CodeField } from "@/components/CodeField"
import { fetchTopicTree } from "@/db/queries"

const ARTIFACT_TYPES: ArtifactType[] = ["general", "stand", "rarity", "fund"]

type Props = {
    searchParams: Promise<{ type?: ArtifactType }>
}

export default async function NewArtifactPage({ searchParams }: Props) {
    const { type } = await searchParams
    const allTopics = await fetchTopicTree()
    const defaultType = ARTIFACT_TYPES.includes(type as ArtifactType) ? type : undefined
    const typeLocked = Boolean(defaultType)

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
                        <TopicTreePicker topics={allTopics} selectedTopicIds={[]} />
                    </Field>
                )}
                <Field label="Тип">
                    {typeLocked && <input type="hidden" name="artifactType" value={defaultType} />}
                    <select
                        name="artifactType"
                        defaultValue={defaultType}
                        disabled={typeLocked}
                        className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}
                    >
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
