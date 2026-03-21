"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/session";

async function currentUser() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) redirect("/admin/login");
  return user;
}

export async function updateProfile(formData: FormData) {
  const user = await currentUser();
  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string).trim().toLowerCase();

  await db.update(users).set({ name, email }).where(eq(users.id, user.id));
  redirect("/admin/settings?success=profile");
}

export async function updatePassword(formData: FormData) {
  const user = await currentUser();
  const current = formData.get("current") as string;
  const next = formData.get("next") as string;
  const confirm = formData.get("confirm") as string;

  if (!(await compare(current, user.password))) redirect("/admin/settings?error=wrong");
  if (next.length < 8) redirect("/admin/settings?error=short");
  if (next !== confirm) redirect("/admin/settings?error=mismatch");

  await db.update(users).set({ password: await hash(next, 12) }).where(eq(users.id, user.id));
  redirect("/admin/settings?success=password");
}
