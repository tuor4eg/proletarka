import { createTopic } from "../actions";
import { inputClass, Field } from "@/components/MaterialForm";
import { SubmitButton } from "@/components/SubmitButton";

export default function NewTopicPage() {
  return (
    <div className="py-6">
      <h1 className="text-xl font-bold mb-6">Новая тема</h1>
      <form action={createTopic} className="flex flex-col gap-4">
        <Field label="Код *" hint="Латиница, без пробелов. Например: factory_today">
          <input name="code" type="text" required pattern="[a-z0-9_]+" className={inputClass} />
        </Field>
        <Field label="Название *">
          <input name="title" type="text" required className={inputClass} />
        </Field>
        <SubmitButton label="Сохранить" className="mt-2" />
      </form>
    </div>
  );
}
