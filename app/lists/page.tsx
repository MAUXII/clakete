"use client"

import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react"
import { UserLists } from "@/components/profile/user-lists"
import { ListCard } from "@/components/lists/list-card"
import { CreateListDialog } from "@/components/profile/create-list-dialog"
import { useState, useEffect } from "react"
import { useLists } from "@/hooks/use-lists"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { userProfilePath } from "@/lib/list-href"
import { Database } from "@/lib/supabase/database.types"

export default function ListsPage() {
  const currentUser = useUser()
  const supabase = useSupabaseClient<Database>()
  const [meUsername, setMeUsername] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { lists: publicLists, loading: publicLoading, error: publicError, fetchPublicLists } = useLists()

  useEffect(() => {
    fetchPublicLists()
  }, [fetchPublicLists])

  useEffect(() => {
    if (!currentUser?.id) {
      setMeUsername(null)
      return
    }
    let cancelled = false
    void (async () => {
      const { data } = await supabase
        .from("users")
        .select("username")
        .eq("id", currentUser.id)
        .maybeSingle()
      if (!cancelled && data?.username) setMeUsername(data.username)
    })()
    return () => {
      cancelled = true
    }
  }, [currentUser?.id, supabase])

  const handleListCreated = () => {
    setShowCreateDialog(false)
  }

  return (
    <div className="w-full">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Listas</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Descubra listas da comunidade e organize suas próprias coleções de filmes.
        </p>
        <div className="mt-4 h-[0.3px] w-full max-w-2xl bg-muted-foreground/10" />
      </div>

      {currentUser && (
        <div>
          {meUsername && (
            <div className="mb-3 flex justify-end">
              <Link
                href={`${userProfilePath(meUsername)}/lists`}
                className="text-sm text-muted-foreground transition-colors hover:text-[#e94e7a]"
              >
                Ver minhas listas
              </Link>
            </div>
          )}
          <UserLists userId={currentUser.id} limit={3} alwaysShowThree={true} />
        </div>
      )}

      <div className={currentUser ? "mt-14" : ""}>
        <h2 className="mb-6 text-xl font-semibold">Listas públicas</h2>

        {publicLoading ? (
          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4 border-b border-black/5 pb-8 dark:border-white/5 sm:flex-row sm:items-start sm:gap-6">
                <Skeleton className="h-[132px] w-[280px] max-w-full shrink-0 rounded-md" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3 max-w-xs" />
                  <Skeleton className="h-4 w-full max-w-md" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : publicError ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>Erro ao carregar listas: {publicError}</p>
          </div>
        ) : publicLists.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <p>Nenhuma lista pública ainda.</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-black/5 dark:divide-white/10">
            {publicLists.map((list) => (
              <div key={list.id} className="py-8 first:pt-0">
                <ListCard list={list} />
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateListDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onListCreated={handleListCreated}
      />
    </div>
  )
}
