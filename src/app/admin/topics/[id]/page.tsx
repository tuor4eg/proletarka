import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { topics } from "@/db/schema";
import { updateTopic, deleteTopic } from "../actions";
import { inputClass, Field } from "@/components/MaterialForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditTopicPage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    notFound();
  }

  const [topic] = await db.select().from(topics).where(eq(topics.id, numericId)).limit(1);

  if (!topic) {
    notFound();
  }

  const action = updateTopic.bind(null, numericId);
  const deleteAction = deleteTopic.bind(null, numericId);

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <Link href="/admin/topics" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">
        ← Все темы
      </Link>
      <h1 className="text-xl font-bold mb-6">Редактировать тему</h1>
      <form action={action} className="flex flex-col gap-4">
        <Field label="Код *" hint="Латиница, без пробелов">
          <input name="code" type="text" required pattern="[a-z0-9_]+" defaultValue={topic.code} className={inputClass} />
        </Field>
        <Field label="Название *">
          <input name="label" type="text" required defaultValue={topic.label} className={inputClass} />
        </Field>
        <button
          type="submit"
          className="mt-2 bg-black text-white text-sm font-medium rounded-xl px-4 py-3 hover:bg-gray-800 transition-colors"
        >
          Сохранить
        </button>
      </form>
      <form action={deleteAction} className="mt-4">
        <button
          type="submit"
          className="w-full text-sm text-red-600 border border-red-200 rounded-xl px-4 py-3 hover:bg-red-50 transition-colors"
        >
          Удалить тему
        </button>
      </form>
    </main>
  );
}
