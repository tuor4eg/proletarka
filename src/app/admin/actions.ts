"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { materials, materialTopics } from "@/db/schema";
import { generateCode } from "@/lib/generateCode";
import { resolveImageUpload, deleteImage } from "@/lib/s3";

async function parseFormData(formData: FormData) {
  const yearFromRaw = formData.get("yearFrom") as string;
  const yearToRaw = formData.get("yearTo") as string;
  const entityIdRaw = formData.get("entityId") as string;

  return {
    title: formData.get("title") as string,
    materialType: formData.get("materialType") as typeof materials.$inferInsert["materialType"],
    status: formData.get("status") as typeof materials.$inferInsert["status"],
    entityId: entityIdRaw ? Number(entityIdRaw) : null,
    summary: (formData.get("summary") as string) || null,
    content: (formData.get("content") as string) || null,
    sourceUrl: (formData.get("sourceUrl") as string) || null,
    coverImagePath: await resolveImageUpload(formData, "coverImageFile", "coverImagePath"),
    yearFrom: yearFromRaw ? Number(yearFromRaw) : null,
    yearTo: yearToRaw ? Number(yearToRaw) : null,
  };
}

function parseTopicIds(formData: FormData): number[] {
  return formData.getAll("topicIds").map(Number).filter(Boolean);
}

export async function createMaterial(formData: FormData) {
  const values = await parseFormData(formData);
  const topicIds = parseTopicIds(formData);
  const code = generateCode(values.title);

  const [inserted] = await db
    .insert(materials)
    .values({ ...values, code })
    .returning({ id: materials.id });

  if (topicIds.length > 0) {
    await db.insert(materialTopics).values(
      topicIds.map((topicId) => ({ materialId: inserted.id, topicId }))
    );
  }

  redirect(`/admin/materials/${inserted.id}`);
}

export async function updateMaterial(id: number, formData: FormData) {
  const [current] = await db
    .select({ coverImagePath: materials.coverImagePath })
    .from(materials)
    .where(eq(materials.id, id))
    .limit(1);

  const values = await parseFormData(formData);
  const topicIds = parseTopicIds(formData);

  if (current?.coverImagePath && current.coverImagePath !== values.coverImagePath) {
    await deleteImage(current.coverImagePath);
  }

  await db
    .update(materials)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(materials.id, id));

  await db.delete(materialTopics).where(eq(materialTopics.materialId, id));
  if (topicIds.length > 0) {
    await db.insert(materialTopics).values(
      topicIds.map((topicId) => ({ materialId: id, topicId }))
    );
  }

  redirect(`/admin`);
}
