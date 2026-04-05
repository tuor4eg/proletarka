export type SearchParams = Promise<{ q?: string; sort?: string; letter?: string; page?: string }>

export type LoginPageProps = {
  searchParams: Promise<{ error?: string }>
}
