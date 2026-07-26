"use client"

import { use } from "react"

import { UserWatchLogPage } from "@/components/profile/user-watch-log-page"

export default function UserFilmWatchLogRewatchPage({
  params,
}: {
  params: Promise<{ username: string; id: string; logIndex: string }>
}) {
  const { username, id, logIndex } = use(params)
  return (
    <UserWatchLogPage
      username={username}
      mediaParam={id}
      mediaType="movie"
      logIndexParam={logIndex}
    />
  )
}
