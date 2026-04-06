import { createTopic } from "../actions"
import { inputClass, Field } from "@/components/MaterialForm"
import { SubmitButton } from "@/components/SubmitButton"
import { CodeField } from "@/components/CodeField"

export default function NewTopicPage() {
    return (
        <div className="py-6">
            <h1 className="text-xl font-bold mb-6">Новая тема</h1>
            <form action={createTopic} className="flex flex-col gap-4">
                <Field label="Название *">
                    <input name="title" type="text" required className={inputClass} />
                </Field>
                <CodeField />
                <SubmitButton label="Сохранить" className="mt-2" />
            </form>
        </div>
    )
}
