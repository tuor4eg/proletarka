import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { materials } from "@/db/schema";

const STATUS_LABEL: Record<string, string> = { draft: "Черновик", published: "Опубл." };
const TYPE_LABEL: Record<string, string> = { article: "Статья", photo: "Фото", document: "Документ" };

export default async function AdminPage() {
  const items = await db.select().from(materials).orderBy(desc(materials.createdAt));

  const published = items.filter((i) => i.status === "published").length;
  const drafts = items.filter((i) => i.status === "draft").length;

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold">Материалы</h1>
        <Link
          href="/admin/new"
          className="text-sm bg-black text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors"
        >
          + Добавить
        </Link>
      </div>
      <p className="text-xs text-gray-400 mb-5">
        {items.length} всего · {published} опубликовано · {drafts} черновиков
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Материалов пока нет.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/admin/${item.id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium flex-1 min-w-0 truncate">{item.title}</span>
              <span className="text-xs text-gray-400 shrink-0">{TYPE_LABEL[item.materialType]}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  item.status === "published"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {STATUS_LABEL[item.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
