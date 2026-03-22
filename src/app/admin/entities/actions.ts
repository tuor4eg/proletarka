"use server";

import { redirect } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { entities, people, materials, materialTopics } from "@/db/schema";
import { generateCode } from "@/lib/generateCode";
import { resolveImageUpload, deleteImage } from "@/lib/s3";
import { flashParam } from "@/lib/flash";

async function parsePersonForm(formData: FormData) {
  const birthYearRaw = formData.get("birthYear") as string;
  const deathYearRaw = formData.get("deathYear") as string;

  return {
    name: (formData.get("name") as string).trim(),
    shortBio: (formData.get("shortBio") as string) || null,
    birthYear: birthYearRaw ? Number(birthYearRaw) : null,
    deathYear: deathYearRaw ? Number(deathYearRaw) : null,
    yearsLabel: (formData.get("yearsLabel") as string) || null,
    mainPhotoPath: await resolveImageUpload(formData, "mainPhotoFile", "mainPhotoPath"),
  };
}

export async function createEntity(formData: FormData) {
  const personValues = await parsePersonForm(formData);
  const code = generateCode(personValues.name);

  const [person] = await db
    .insert(people)
    .values({ ...personValues, code })
    .returning({ id: people.id });

  const [entity] = await db
    .insert(entities)
    .values({ type: "person", personId: person.id, code })
    .returning({ id: entities.id });

  redirect(`/admin/entities/${entity.id}${flashParam("Человек добавлен")}`);
}

export async function updateEntity(personId: number, formData: FormData) {
  const [current] = await db
    .select({ mainPhotoPath: people.mainPhotoPath })
    .from(people)
    .where(eq(people.id, personId))
    .limit(1);

  const personValues = await parsePersonForm(formData);

  if (current?.mainPhotoPath && current.mainPhotoPath !== personValues.mainPhotoPath) {
    await deleteImage(current.mainPhotoPath);
  }

  const [[entity]] = await Promise.all([
    db.select({ id: entities.id }).from(entities).where(eq(entities.personId, personId)).limit(1),
    db.update(people).set({ ...personValues, updatedAt: new Date() }).where(eq(people.id, personId)),
  ]);

  if (!entity?.id) redirect("/admin/entities");
  redirect(`/admin/entities/${entity.id}${flashParam("Сохранено")}`);
}

export async function deleteEntity(entityId: number, personId: number) {
  const linkedMaterials = await db
    .select({ id: materials.id, coverImagePath: materials.coverImagePath })
    .from(materials)
    .where(eq(materials.entityId, entityId));

  if (linkedMaterials.length > 0) {
    const materialIds = linkedMaterials.map((m) => m.id);
    await db.delete(materialTopics).where(inArray(materialTopics.materialId, materialIds));
    await db.delete(materials).where(inArray(materials.id, materialIds));

    const imagesToDelete = linkedMaterials.map((m) => m.coverImagePath).filter(Boolean) as string[];
    await Promise.all(imagesToDelete.map((path) => deleteImage(path)));
  }

  await db.delete(entities).where(eq(entities.id, entityId));
  await db.delete(people).where(eq(people.id, personId));
  redirect(`/admin/entities${flashParam("Запись удалена")}`);
}
