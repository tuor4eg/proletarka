import Link from "next/link"
import { User } from "lucide-react"

type Props = {
    entityId: number
    name: string
    years?: string | null
    context?: string | null
    mainPhotoPath?: string | null
}

export function PersonCard({ entityId, name, years, context, mainPhotoPath }: Props) {
    return (
        <Link
            href={`/people/${entityId}`}
            className="flex flex-col items-center gap-2 w-20 shrink-0 hover:opacity-70 transition-opacity"
        >
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                {mainPhotoPath ? (
                    <img src={mainPhotoPath} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <User size={22} className="text-gray-300" />
                )}
            </div>
            <div className="text-center">
                <p className="text-xs font-medium text-gray-800 leading-tight line-clamp-2">
                    {name}
                </p>
                {years && <p className="text-xs text-gray-400 mt-0.5">{years}</p>}
                {context && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{context}</p>}
            </div>
        </Link>
    )
}
