import Link from "next/link";
import { materials } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

type Material = InferSelectModel<typeof materials>;

const THEME_LABELS: Record<Material["theme"], string> = {
  people: "Люди",
  war: "Война",
  documents: "Документы",
  photos: "Фото",
  factory_today: "Завод сегодня",
};

type Props = {
  material: Material;
};

export function MaterialCard({ material }: Props) {
  const { title, summary, theme, yearFrom, yearTo } = material;

  const yearLabel =
    yearFrom && yearTo
      ? `${yearFrom}–${yearTo}`
      : yearFrom
      ? `${yearFrom}`
      : null;

  return (
    <Link href={`/materials/${material.id}`}>
      <div className="rounded-2xl border border-gray-200 p-4 flex flex-col gap-2 hover:border-gray-400 transition-colors">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{THEME_LABELS[theme]}</span>
          {yearLabel && <span>· {yearLabel}</span>}
        </div>
        <h2 className="text-base font-semibold leading-snug">{title}</h2>
        {summary && <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>}
      </div>
    </Link>
  );
}
