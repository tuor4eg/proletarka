"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { materials } from "@/db/schema";
import { generateCode } from "@/lib/generateCode";

function parseFormData(formData: FormData) {
  const yearFromRaw = formData.get("yearFrom") as string;
  const yearToRaw = formData.get("yearTo") as string;

  return {
    title: formData.get("title") as string,
    theme: formData.get("theme") as typeof materials.$inferInsert["theme"],
    status: formData.get("status") as typeof materials.$inferInsert["status"],
    summary: (formData.get("summary") as string) || null,
    content: (formData.get("content") as string) || null,
    sourceUrl: (formData.get("sourceUrl") as string) || null,
    yearFrom: yearFromRaw ? Number(yearFromRaw) : null,
    yearTo: yearToRaw ? Number(yearToRaw) : null,
  };
}

export async function createMaterial(formData: FormData) {
  const values = parseFormData(formData);
  const code = generateCode(values.title);

  const [inserted] = await db
    .insert(materials)
    .values({ ...values, code })
    .returning({ id: materials.id });

  redirect(`/materials/${inserted.id}`);
}

export async function updateMaterial(id: number, formData: FormData) {
  const values = parseFormData(formData);

  await db
    .update(materials)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(materials.id, id));

  redirect(`/admin`);
}
