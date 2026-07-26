"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function ActivityRedirectPage() {
  const router = useRouter()
  const params = useParams()
  const username = params.username as string

  useEffect(() => {
    router.replace(`/${username}/diary`)
  }, [router, username])

  return null
}
