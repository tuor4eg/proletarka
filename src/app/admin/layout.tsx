import { AdminNav } from "@/components/AdminNav"
import { getAdminAccess } from "@/lib/adminAuth"
import { FlashToast } from "@/components/FlashToast"
import { TooltipProvider } from "@/components/ui/tooltip"
import { count, eq } from "drizzle-orm"
import { db } from "@/db"
import { comments } from "@/db/schema"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const access = await getAdminAccess()
    const user = "user" in access ? access.user : null
    const [{ total: pendingCommentsCount }] = user
        ? await db.select({ total: count() }).from(comments).where(eq(comments.status, "pending"))
        : [{ total: 0 }]

    return (
        <TooltipProvider delay={300}>
            <div className="min-h-screen bg-gray-50">
                {user && <AdminNav hasPendingComments={pendingCommentsCount > 0} />}
                <div className="max-w-4xl mx-auto px-4">{children}</div>
                <FlashToast />
            </div>
        </TooltipProvider>
    )
}
