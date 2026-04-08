import { AdminNav } from "@/components/AdminNav"
import { getSession } from "@/lib/session"
import { Toaster } from "@/components/ui/sonner"
import { FlashToast } from "@/components/FlashToast"
import { TooltipProvider } from "@/components/ui/tooltip"
import { db } from "@/db"
import { comments } from "@/db/schema"
import { count, eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await getSession()
    const [{ total: pendingCommentsCount }] = session
        ? await db.select({ total: count() }).from(comments).where(eq(comments.status, "pending"))
        : [{ total: 0 }]

    return (
        <TooltipProvider delay={300}>
            <div className="min-h-screen bg-gray-50">
                {session && <AdminNav hasPendingComments={pendingCommentsCount > 0} />}
                <div className="max-w-4xl mx-auto px-4">{children}</div>
                <Toaster position="bottom-right" richColors />
                <FlashToast />
            </div>
        </TooltipProvider>
    )
}
