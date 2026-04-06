"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { triggerNavigationStart } from "@/components/NavigationProgress"

const ACTIONS = [
    { value: "", label: "Все действия" },
    { value: "create", label: "Создание" },
    { value: "update", label: "Обновление" },
    { value: "delete", label: "Удаление" },
    { value: "publish", label: "Публикация" },
    { value: "unpublish", label: "Снятие" },
]

const ENTITY_TYPES = [
    { value: "", label: "Все объекты" },
    { value: "person", label: "Человек" },
    { value: "artifact", label: "Объект" },
    { value: "artifactSection", label: "Секция" },
    { value: "material", label: "Материал" },
    { value: "topic", label: "Тема" },
]

const SORTS = [
    { value: "desc", label: "Новые сначала" },
    { value: "asc", label: "Старые сначала" },
]

const selectClass =
    "rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"

type Props = {
    action: string
    entityType: string
    userId: string
    sort: string
    users: { id: number; name: string }[]
}

export function LogsFilters({ action, entityType, userId, sort, users }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    function updateParam(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("page")
        if (value) params.set(key, value)
        else params.delete(key)
        triggerNavigationStart()
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex gap-2 mb-4 flex-wrap">
            <select
                defaultValue={action}
                onChange={(e) => updateParam("action", e.target.value)}
                className={selectClass}
            >
                {ACTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </select>
            <select
                defaultValue={entityType}
                onChange={(e) => updateParam("entityType", e.target.value)}
                className={selectClass}
            >
                {ENTITY_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </select>
            {users.length > 1 && (
                <select
                    defaultValue={userId}
                    onChange={(e) => updateParam("userId", e.target.value)}
                    className={selectClass}
                >
                    <option value="">Все пользователи</option>
                    {users.map((u) => (
                        <option key={u.id} value={String(u.id)}>
                            {u.name}
                        </option>
                    ))}
                </select>
            )}
            <select
                defaultValue={sort}
                onChange={(e) => updateParam("sort", e.target.value)}
                className={selectClass}
            >
                {SORTS.map(({ value, label }) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </select>
        </div>
    )
}
