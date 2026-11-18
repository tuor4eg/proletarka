import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"

export default async function AdminPage() {
    await requireAdmin()
    redirect("/admin/people")
}
