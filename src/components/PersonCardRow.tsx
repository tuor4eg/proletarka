import { PersonCard } from "@/components/PersonCard"

type Person = {
    entityId: number
    code: string
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
        <div className="grid grid-cols-4 gap-3">
            {people.map((person) => (
                <PersonCard key={person.entityId} {...person} />
            ))}
        </div>
    )
}
