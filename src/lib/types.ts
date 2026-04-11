export type SearchParams = Promise<{
    q?: string
    sort?: string
    letter?: string
    page?: string
    backstack?: string
}>

export type LoginPageProps = {
    searchParams: Promise<{ error?: string }>
}
