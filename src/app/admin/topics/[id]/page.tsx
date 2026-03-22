import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { topics } from "@/db/schema";
import { updateTopic, deleteTopic } from "../actions";
import { inputClass, Field } from "@/components/MaterialForm";
import { DeleteButton } from "@/components/DeleteButton";
import { SubmitButton } from "@/components/SubmitButton";
import { EditPageHeader } from "@/components/EditPageHeader";

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
      <EditPageHeader />
      <h1 className="text-xl font-bold mb-6">Редактировать тему</h1>
      <form action={action} className="flex flex-col gap-4">
        <Field label="Код *" hint="Латиница, без пробелов">
          <input name="code" type="text" required pattern="[a-z0-9_]+" defaultValue={topic.code} className={inputClass} />
        </Field>
        <Field label="Название *">
          <input name="title" type="text" required defaultValue={topic.title} className={inputClass} />
        </Field>
        <div className="flex items-center gap-3 mt-0">
          <SubmitButton label="Сохранить" />
          <DeleteButton action={deleteAction} />
        </div>
      </form>
    </div>
  );
}
