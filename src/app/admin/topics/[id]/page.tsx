import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { topics } from "@/db/schema";
import { updateTopic, deleteTopic } from "../actions";
import { inputClass, Field } from "@/components/MaterialForm";
import { DeleteButton } from "@/components/DeleteButton";

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
    <div className="py-6">
      <h1 className="text-xl font-bold mb-6">Редактировать тему</h1>
      <form id="topic-update-form" action={action} className="flex flex-col gap-4">
        <Field label="Код *" hint="Латиница, без пробелов">
          <input name="code" type="text" required pattern="[a-z0-9_]+" defaultValue={topic.code} className={inputClass} />
        </Field>
        <Field label="Название *">
          <input name="title" type="text" required defaultValue={topic.title} className={inputClass} />
        </Field>
      </form>
      <div className="flex items-center gap-3 mt-4">
        <button
          type="submit"
          form="topic-update-form"
          className="bg-black text-white text-sm font-medium rounded-xl px-4 py-2.5 hover:bg-gray-800 transition-colors"
        >
          Сохранить
        </button>
        <a
          href="/admin/topics"
          className="text-sm font-medium text-gray-500 border border-gray-200 rounded-xl px-4 py-2.5 hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          Отмена
        </a>
        <DeleteButton action={deleteAction} />
      </div>
    </div>
  );
}
