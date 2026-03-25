import { createArtifact } from "../actions"
import { inputClass, Field } from "@/components/MaterialForm"
import { SubmitButton } from "@/components/SubmitButton"
import { CodeField } from "@/components/CodeField"

export default function NewArtifactPage() {
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
                <Field
                    label="Период"
                    hint="Например: «1941–1945» или «ок. 1943»"
                >
                    <input name="yearsLabel" type="text" className={inputClass} />
                </Field>
                <CodeField />
                <SubmitButton label="Сохранить" className="mt-2" />
            </form>
        </div>
    )
}
