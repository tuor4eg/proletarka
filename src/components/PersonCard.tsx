import Link from "next/link"
import { User } from "lucide-react"

type Props = {
    code: string
    name: string
    years?: string | null
    context?: string | null
    mainPhotoPath?: string | null
}

export function PersonCard({ code, name, years, context, mainPhotoPath }: Props) {
    return (
        <Link
            href={`/people/${code}`}
            className="flex flex-col items-center gap-2 w-20 shrink-0 hover:opacity-70 transition-opacity"
        >
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-paper-dark flex items-center justify-center">
                {mainPhotoPath ? (
                    <img src={mainPhotoPath} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <User size={22} className="text-ink-muted" />
                )}
            </div>
            <div className="text-center">
                <p className="text-xs font-medium text-ink leading-tight line-clamp-2">
                    {name}
                </p>
                {years && <p className="text-xs text-ink-muted mt-0.5">{years}</p>}
                {context && <p className="text-xs text-ink-secondary mt-0.5 line-clamp-2">{context}</p>}
            </div>
        </Link>
    )
}
