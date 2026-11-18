import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { users } from "@/db/schema"
import { getSession } from "@/lib/session"

export type AdminUser = Pick<typeof users.$inferSelect, "id" | "name" | "email" | "role">

export async function getAdminAccess(): Promise<{ user: AdminUser } | { status: 401 | 403 }> {
    const session: unknown = await getSession()
    if (
        typeof session !== "object" ||
        session === null ||
        Array.isArray(session) ||
        !("userId" in session) ||
        typeof session.userId !== "number" ||
        !Number.isSafeInteger(session.userId) ||
        session.userId <= 0 ||
        !("role" in session) ||
        typeof session.role !== "string"
    ) {
        return { status: 401 }
    }

    const [user] = await db
        .select({ id: users.id, name: users.name, email: users.email, role: users.role })
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1)

    if (!user) return { status: 401 }
    if (session.role !== "admin" || user.role !== "admin") return { status: 403 }

    return { user }
}

export async function requireAdmin(): Promise<AdminUser> {
    const access = await getAdminAccess()
    if ("status" in access) redirect("/admin/login")
    return access.user
}
