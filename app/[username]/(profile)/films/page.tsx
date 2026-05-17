import { redirect } from "next/navigation"

export default async function FilmsPageRedirect({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  redirect(`/${username}/watched`)
}
