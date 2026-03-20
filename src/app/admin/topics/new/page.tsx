import Link from "next/link";
import { createTopic } from "../actions";
import { inputClass, Field } from "@/components/MaterialForm";

export default function NewTopicPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <Link href="/admin/topics" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">
        ← Все темы
      </Link>
      <h1 className="text-xl font-bold mb-6">Новая тема</h1>
      <form action={createTopic} className="flex flex-col gap-4">
        <Field label="Код *" hint="Латиница, без пробелов. Например: factory_today">
          <input name="code" type="text" required pattern="[a-z0-9_]+" className={inputClass} />
        </Field>
        <Field label="Название *">
          <input name="label" type="text" required className={inputClass} />
        </Field>
        <button
          type="submit"
          className="mt-2 bg-black text-white text-sm font-medium rounded-xl px-4 py-3 hover:bg-gray-800 transition-colors"
        >
          Сохранить
        </button>
      </form>
    </main>
  );
}
