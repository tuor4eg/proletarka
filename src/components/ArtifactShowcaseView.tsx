"use client"

import { type InferSelectModel } from "drizzle-orm"
import { artifacts, materials } from "@/db/schema"

type Artifact = InferSelectModel<typeof artifacts>
type Material = Pick<
    InferSelectModel<typeof materials>,
    "id" | "title" | "summary" | "content" | "materialType" | "coverImagePath" | "yearFrom" | "yearTo"
>

type Props = {
    artifact: Artifact
    materials: Material[]
}

export function ArtifactShowcaseView({ artifact, materials }: Props) {
    const photos = materials.filter((m) => m.materialType === "photo")
    const articles = materials.filter((m) => m.materialType === "article")
    const documents = materials.filter((m) => m.materialType === "document")

    return (
        <section className="my-8">
            <h2 className="text-xl font-bold">{artifact.title}</h2>
            <p className="text-sm text-gray-400 mt-1">
                фото: {photos.length}, статей: {articles.length}, документов: {documents.length}
            </p>
        </section>
    )
}
