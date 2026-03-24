import { PersonCard } from "@/components/PersonCard"

type Person = {
    entityId: number
    name: string
    years?: string | null
    context?: string | null
    mainPhotoPath?: string | null
}

type Props = {
    people: Person[]
}

export function PersonCardRow({ people }: Props) {
    return (
        <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-4 pb-2" style={{ width: "max-content" }}>
                {people.map((person) => (
                    <PersonCard key={person.entityId} {...person} />
                ))}
            </div>
        </div>
    )
}
