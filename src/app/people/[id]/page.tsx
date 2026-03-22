import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { entities, people, materials } from "@/db/schema";
import { PublicNavWrapper } from "@/components/PublicNavWrapper";
import { PersonTabs } from "@/components/PersonTabs";
import { BackButton } from "@/components/BackButton";

type Props = {
  params: Promise<{ id: string }>;
};

function formatYears(birthYear: number | null, deathYear: number | null, yearsLabel: string | null) {
  if (birthYear || deathYear) {
    return `${birthYear ?? "?"}–${deathYear ?? "..."}`;
  }
  return yearsLabel ?? null;
}

export default async function PersonPage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const [row] = await db
    .select({ entity: entities, person: people })
    .from(entities)
    .innerJoin(people, eq(entities.personId, people.id))
    .where(eq(entities.id, numericId))
    .limit(1);

  if (!row) notFound();

  const { person } = row;

  const linkedMaterials = await db
    .select({
      id: materials.id,
      title: materials.title,
      summary: materials.summary,
      coverImagePath: materials.coverImagePath,
      yearFrom: materials.yearFrom,
      yearTo: materials.yearTo,
      sourceUrl: materials.sourceUrl,
      materialType: materials.materialType,
    })
    .from(materials)
    .where(and(eq(materials.entityId, numericId), eq(materials.status, "published")));

  const articles = linkedMaterials.filter((m) => m.materialType === "article");
  const photos = linkedMaterials.filter((m) => m.materialType === "photo");
  const documents = linkedMaterials.filter((m) => m.materialType === "document");

  const years = formatYears(person.birthYear, person.deathYear, person.yearsLabel);

  return (
    <>
      <PublicNavWrapper />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <BackButton />
        </div>
        <div className="flex gap-6 mb-8">
          <div className="w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-gray-100">
            {person.mainPhotoPath ? (
              <img
                src={person.mainPhotoPath}
                alt={person.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl font-light">
                {person.name[0]}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold">{person.name}</h1>
            {years && <p className="text-sm text-gray-400 mt-1">{years}</p>}
            {person.shortBio && (
              <p className="text-sm text-gray-600 mt-2">{person.shortBio}</p>
            )}
          </div>
        </div>

        <PersonTabs articles={articles} photos={photos} documents={documents} />
      </main>
    </>
  );
}
