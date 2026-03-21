import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { entities, people } from "@/db/schema";
import { updateEntity, deleteEntity } from "../actions";
import { inputClass, Field } from "@/components/MaterialForm";
import { ImageUpload } from "@/components/ImageUpload";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditEntityPage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    notFound();
  }

  const [row] = await db
    .select({ entity: entities, person: people })
    .from(entities)
    .leftJoin(people, eq(entities.personId, people.id))
    .where(eq(entities.id, numericId))
    .limit(1);

  if (!row) {
    notFound();
  }

  const { entity, person } = row;
  const updateAction = updateEntity.bind(null, person!.id);
  const deleteAction = deleteEntity.bind(null, entity.id, person!.id);

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <Link href="/admin/entities" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">
        ← Все карточки
      </Link>
      <h1 className="text-xl font-bold mb-6">Редактировать человека</h1>
      <form action={updateAction} className="flex flex-col gap-4">
        <Field label="Имя *">
          <input name="name" type="text" required defaultValue={person?.name ?? ""} className={inputClass} />
        </Field>
        <Field label="Краткая биография">
          <textarea name="shortBio" rows={3} defaultValue={person?.shortBio ?? ""} className={inputClass} />
        </Field>
        <div className="flex gap-4">
          <Field label="Год рождения">
            <input name="birthYear" type="number" min={1800} max={2100} defaultValue={person?.birthYear ?? ""} className={inputClass} />
          </Field>
          <Field label="Год смерти">
            <input name="deathYear" type="number" min={1800} max={2100} defaultValue={person?.deathYear ?? ""} className={inputClass} />
          </Field>
        </div>
        <Field label="Годы жизни (если точные неизвестны)" hint="Например: «не позднее 1917» или «ок. 1890–1943»">
          <input name="yearsLabel" type="text" defaultValue={person?.yearsLabel ?? ""} className={inputClass} />
        </Field>
        <ImageUpload fileInputName="mainPhotoFile" urlInputName="mainPhotoPath" defaultUrl={person?.mainPhotoPath} label="Фото" />
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
          Удалить
        </button>
      </form>
    </main>
  );
}
