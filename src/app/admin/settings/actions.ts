"use server"

import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { compare, hash } from "bcryptjs"
import { db } from "@/db"
import { users, showcases } from "@/db/schema"
import { requireAdmin } from "@/lib/adminAuth"
import { flashParam } from "@/lib/flash"

export async function updateProfile(formData: FormData) {
    const user = await requireAdmin()
    const name = (formData.get("name") as string).trim()
    const email = (formData.get("email") as string).trim().toLowerCase()

    await db.update(users).set({ name, email }).where(eq(users.id, user.id))
    redirect(`/admin/settings${flashParam("Данные сохранены")}`)
}

export async function updatePassword(formData: FormData) {
    const user = await requireAdmin()
    const [credentials] = await db
        .select({ password: users.password })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)
    if (!credentials) redirect("/admin/login")

    const current = formData.get("current") as string
    const next = formData.get("next") as string
    const confirm = formData.get("confirm") as string

    if (!(await compare(current, credentials.password)))
        redirect(`/admin/settings${flashParam("Неверный текущий пароль", "error")}`)
    if (next.length < 8)
        redirect(
            `/admin/settings${flashParam("Новый пароль должен быть не короче 8 символов", "error")}`,
        )
    if (next !== confirm)
        redirect(`/admin/settings${flashParam("Новые пароли не совпадают", "error")}`)

    await db
        .update(users)
        .set({ password: await hash(next, 12) })
        .where(eq(users.id, user.id))
    redirect(`/admin/settings${flashParam("Пароль изменён")}`)
}

export async function setShowcases(formData: FormData) {
    await requireAdmin()

    const showcaseEntries = Array.from(formData.entries()).filter(([key]) =>
        key.startsWith("showcase:"),
    )

    for (const [key, value] of showcaseEntries) {
        const sectionCode = key.slice("showcase:".length)
        const artifactIdRaw = String(value)

        if (!artifactIdRaw) {
            await db.delete(showcases).where(eq(showcases.sectionCode, sectionCode))
            continue
        }

        const artifactId = Number(artifactIdRaw)
        await db
            .insert(showcases)
            .values({ sectionCode, artifactId })
            .onConflictDoUpdate({ target: showcases.sectionCode, set: { artifactId } })
    }

    redirect(`/admin/settings?tab=showcases${flashParam("Сохранено").replace("?", "&")}`)
}
