import { db } from "@/db";
import { materials } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function MaterialPage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    notFound();
  }

  const [material] = await db
    .select()
    .from(materials)
    .where(eq(materials.id, numericId))
    .limit(1);

  if (!material || material.status !== "published") {
    notFound();
  }

  const { title, yearFrom, yearTo, content, sourceUrl, coverImagePath } = material;

  const yearLabel =
    yearFrom && yearTo
      ? `${yearFrom}–${yearTo}`
      : yearFrom
      ? `${yearFrom}`
      : null;

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">
        ← Назад
      </Link>
      {yearLabel && (
        <p className="text-sm text-gray-500 mb-2">{yearLabel}</p>
      )}
      <h1 className="text-xl font-bold leading-snug mb-4">{title}</h1>
      {coverImagePath && (
        <img
          src={coverImagePath}
          alt={title}
          className="w-full rounded-xl mb-4 object-cover max-h-80"
        />
      )}
      {content && (
        <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      )}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-sm text-blue-600 hover:underline"
        >
          Источник →
        </a>
      )}
    </main>
  );
}
