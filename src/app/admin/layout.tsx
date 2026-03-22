import { AdminNav } from "@/components/AdminNav";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-gray-50">
      {session && <AdminNav />}
      <div className="max-w-4xl mx-auto px-4">
        {children}
      </div>
    </div>
  );
}
