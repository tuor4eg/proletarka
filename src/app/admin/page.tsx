import Link from "next/link";
import { desc, asc, ilike, eq, and, count } from "drizzle-orm";
import { db } from "@/db";
import { materials } from "@/db/schema";
import { AdminFilters } from "@/components/AdminFilters";
import { PublishToggle } from "@/components/PublishToggle";
import { Pagination } from "@/components/Pagination";
import { Suspense } from "react";

const STATUS_LABEL: Record<string, string> = { draft: "Черновик", published: "Опубл." };
const TYPE_LABEL: Record<string, string> = { article: "Статья", photo: "Фото", document: "Документ" };
const PAGE_SIZE = 20;

type SearchParams = Promise<{ q?: string; status?: string; type?: string; sort?: string; page?: string }>;

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, status, type, sort = "date_desc", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const conditions = [
    q ? ilike(materials.title, `%${q}%`) : undefined,
    status ? eq(materials.status, status as typeof materials.$inferSelect["status"]) : undefined,
    type ? eq(materials.materialType, type as typeof materials.$inferSelect["materialType"]) : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const where = conditions.length ? and(...conditions) : undefined;

  const orderBy =
    sort === "date_asc" ? asc(materials.createdAt) :
    sort === "title_asc" ? asc(materials.title) :
    sort === "title_desc" ? desc(materials.title) :
    desc(materials.createdAt);

  const [items, [{ total }], allItems] = await Promise.all([
    db.select().from(materials).where(where).orderBy(orderBy).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(materials).where(where),
    db.select({ status: materials.status }).from(materials),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const published = allItems.filter((i) => i.status === "published").length;
  const drafts = allItems.filter((i) => i.status === "draft").length;

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
        {allItems.length} всего · {published} опубликовано · {drafts} черновиков
      </p>
      <Suspense>
        <AdminFilters q={q ?? ""} status={status ?? ""} type={type ?? ""} sort={sort} showStatus showType />
      </Suspense>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Ничего не найдено.</p>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 px-4 hover:bg-gray-50 transition-colors">
                <Link
                  href={`/admin/${item.id}`}
                  className="flex items-center gap-3 py-2.5 flex-1 min-w-0"
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
                <PublishToggle id={item.id} status={item.status} />
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} searchParams={{ q, status, type, sort }} />
        </>
      )}
    </div>
  );
}
