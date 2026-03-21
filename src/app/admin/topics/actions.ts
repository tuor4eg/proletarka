"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { topics } from "@/db/schema";

function parseTopicForm(formData: FormData) {
  return {
    code: (formData.get("code") as string).trim(),
    title: (formData.get("title") as string).trim(),
  };
}

export async function createTopic(formData: FormData) {
  const values = parseTopicForm(formData);
  await db.insert(topics).values(values);
  redirect("/admin/topics");
}

export async function updateTopic(id: number, formData: FormData) {
  const values = parseTopicForm(formData);
  await db.update(topics).set(values).where(eq(topics.id, id));
  redirect("/admin/topics");
}

export async function deleteTopic(id: number) {
  await db.delete(topics).where(eq(topics.id, id));
  redirect("/admin/topics");
}
