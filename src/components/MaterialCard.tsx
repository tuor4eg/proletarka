import Link from "next/link";
import { InferSelectModel } from "drizzle-orm";
import { materials } from "@/db/schema";

type MaterialWithTopic = InferSelectModel<typeof materials> & { topicLabel: string };

type Props = {
  material: MaterialWithTopic;
};

export function MaterialCard({ material }: Props) {
  const { title, summary, topicLabel, yearFrom, yearTo } = material;

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
          <span>{topicLabel}</span>
          {yearLabel && <span>· {yearLabel}</span>}
        </div>
        <h2 className="text-base font-semibold leading-snug">{title}</h2>
        {summary && <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>}
      </div>
    </Link>
  );
}
