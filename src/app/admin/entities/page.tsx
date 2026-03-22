import Link from "next/link";
import { eq, ilike, asc, desc, and, sql } from "drizzle-orm";
import { Suspense } from "react";
import { db } from "@/db";
import { entities, people } from "@/db/schema";
import { AdminFilters } from "@/components/AdminFilters";
import { LetterFilter } from "@/components/LetterFilter";

type SearchParams = Promise<{ q?: string; sort?: string; letter?: string }>;

export default async function EntitiesPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, sort = "title_asc", letter } = await searchParams;

  const orderBy =
    sort === "title_desc" ? desc(people.name) :
    sort === "date_desc" ? desc(entities.id) :
    sort === "date_asc" ? asc(entities.id) :
    asc(people.name);

  const conditions = [
    q ? ilike(people.name, `%${q}%`) : undefined,
    letter ? ilike(people.name, `${letter}%`) : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const [rows, letterRows] = await Promise.all([
    db
      .select({ id: entities.id, type: entities.type, personName: people.name })
      .from(entities)
      .leftJoin(people, eq(entities.personId, people.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(orderBy),
    db
      .selectDistinct({ letter: sql<string>`UPPER(LEFT(${people.name}, 1))` })
      .from(people),
  ]);

  const availableLetters = letterRows.map((r) => r.letter).filter(Boolean);

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Картотека</h1>
        <Link
          href="/admin/entities/new"
          className="text-sm bg-black text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors"
        >
          + Добавить
        </Link>
      </div>
      <LetterFilter availableLetters={availableLetters} compact />
      <Suspense>
        <AdminFilters q={q ?? ""} sort={sort} sortOptions="title_only" />
      </Suspense>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">Ничего не найдено.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {rows.map((row) => (
            <Link
              key={row.id}
              href={`/admin/entities/${row.id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium flex-1">{row.personName ?? `#${row.id}`}</span>
              <span className="text-xs text-gray-400">Человек</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
