import Link from "next/link";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { topics, materialTopics } from "@/db/schema";
import { deleteTopic } from "./actions";
import { DeleteButton } from "@/components/DeleteButton";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 20;

type SearchParams = Promise<{ page?: string }>;

export default async function TopicsPage({ searchParams }: { searchParams: SearchParams }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [list, [{ total }]] = await Promise.all([
    db
      .select({ id: topics.id, title: topics.title, code: topics.code, materialCount: count(materialTopics.materialId) })
      .from(topics)
      .leftJoin(materialTopics, eq(materialTopics.topicId, topics.id))
      .groupBy(topics.id)
      .orderBy(asc(topics.title))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(topics),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Темы</h1>
        <Link
          href="/admin/topics/new"
          className="text-sm bg-black text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors"
        >
          + Добавить
        </Link>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-gray-500">Тем пока нет.</p>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {list.map((topic) => {
              const deleteAction = deleteTopic.bind(null, topic.id);
              return (
                <div key={topic.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Link
                    href={`/admin/topics/${topic.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-70 transition-opacity"
                  >
                    <span className="text-sm font-medium flex-1 truncate">{topic.title}</span>
                    <span className="text-xs text-gray-400">{topic.code}</span>
                  </Link>
                  <span className="text-xs text-gray-400 shrink-0 min-w-[3ch] text-right">
                    {topic.materialCount > 0 ? topic.materialCount : ""}
                  </span>
                  <DeleteButton action={deleteAction} icon disabled={topic.materialCount > 0} disabledTooltip="Есть материалы" />
                </div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} searchParams={{}} />
        </>
      )}
    </div>
  );
}
