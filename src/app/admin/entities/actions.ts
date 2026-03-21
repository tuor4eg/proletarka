"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { entities, people } from "@/db/schema";
import { generateCode } from "@/lib/generateCode";
import { resolveImageUpload, deleteImage } from "@/lib/s3";

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

  await db.insert(entities).values({
    type: "person",
    personId: person.id,
    code,
  });

  redirect("/admin/entities");
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

  await db
    .update(people)
    .set({ ...personValues, updatedAt: new Date() })
    .where(eq(people.id, personId));

  redirect("/admin/entities");
}

export async function deleteEntity(entityId: number, personId: number) {
  await db.delete(entities).where(eq(entities.id, entityId));
  await db.delete(people).where(eq(people.id, personId));
  redirect("/admin/entities");
}
