export const warPeopleTabGroups = [
    {
        title: "Погибли за Родину",
        items: [
            { key: "not-returned", label: "Не вернулись с фронта" },
            { key: "former-workers", label: "Бывшие заводчане" },
        ],
    },
    {
        title: "Участники войны",
        items: [
            { key: "factory-to-front", label: "С завода на фронт" },
            { key: "joined-after-war", label: "Пришли на завод после войны" },
        ],
    },
] as const

export const warPeopleTabs = [
    ...warPeopleTabGroups[0].items,
    ...warPeopleTabGroups[1].items,
] as const

export type WarPeopleTabKey = (typeof warPeopleTabGroups)[number]["items"][number]["key"]

export const defaultWarPeopleTab: WarPeopleTabKey = "not-returned"
