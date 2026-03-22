import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { entities, people, materials } from "@/db/schema";
import { updateEntity, deleteEntity } from "../actions";
import { inputClass, Field } from "@/components/MaterialForm";
import { ImageUpload } from "@/components/ImageUpload";
import { DeleteButton } from "@/components/DeleteButton";
import { SubmitButton } from "@/components/SubmitButton";

const TYPE_LABEL: Record<string, string> = { article: "Статья", photo: "Фото", document: "Документ" };
const STATUS_LABEL: Record<string, string> = { draft: "Черновик", published: "Опубл." };

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

  const linkedMaterials = await db
    .select({ id: materials.id, title: materials.title, materialType: materials.materialType, status: materials.status })
    .from(materials)
    .where(eq(materials.entityId, numericId))
    .orderBy(desc(materials.createdAt));

  const { entity, person } = row;
  const updateAction = updateEntity.bind(null, person!.id);
  const deleteAction = deleteEntity.bind(null, entity.id, person!.id);

  return (
    <div className="py-6">
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
        <ImageUpload fileInputName="mainPhotoFile" urlInputName="mainPhotoPath" defaultUrl={person?.mainPhotoPath} label="Обложка" />
        <div className="flex items-center gap-3 mt-0">
          <SubmitButton label="Сохранить" />
          <a
            href="/admin/entities"
            className="text-sm font-medium text-gray-500 border border-gray-200 rounded-xl px-4 py-2.5 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            Отмена
          </a>
          <DeleteButton action={deleteAction} />
        </div>
      </form>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Материалы</h2>
          <Link
            href={`/admin/new?entityId=${numericId}&materialType=photo`}
            className="text-sm bg-black text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors"
          >
            + Добавить материал
          </Link>
        </div>
        {linkedMaterials.length === 0 ? (
          <p className="text-sm text-gray-400">Материалов пока нет.</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {linkedMaterials.map((m) => (
              <Link
                key={m.id}
                href={`/admin/${m.id}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium flex-1 min-w-0 truncate">{m.title}</span>
                <span className="text-xs text-gray-400 shrink-0">{TYPE_LABEL[m.materialType]}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  m.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {STATUS_LABEL[m.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
