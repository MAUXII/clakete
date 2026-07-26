"use client"

import { use } from "react"

import { UserWatchLogPage } from "@/components/profile/user-watch-log-page"

export default function UserSeriesWatchLogPage({
  params,
}: {
  params: Promise<{ username: string; id: string }>
}) {
  const { username, id } = use(params)
  return (
    <UserWatchLogPage username={username} mediaParam={id} mediaType="tv" />
  )
}
