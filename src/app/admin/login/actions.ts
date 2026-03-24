"use server"

import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { compare } from "bcryptjs"
import { db } from "@/db"
import { users } from "@/db/schema"
import { createSession } from "@/lib/session"

export async function login(formData: FormData) {
    const email = (formData.get("email") as string).trim().toLowerCase()
    const password = formData.get("password") as string

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

    if (!user || !(await compare(password, user.password))) {
        redirect("/admin/login?error=1")
    }

    await createSession({ userId: user.id, role: user.role })
    redirect("/admin")
}
