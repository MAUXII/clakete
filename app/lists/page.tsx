"use client"

import { useUser } from "@supabase/auth-helpers-react"
import { UserLists } from "@/components/profile/user-lists"
import { ListCard } from "@/components/lists/list-card"
import { CreateListDialog } from "@/components/profile/create-list-dialog"
import { useState, useEffect } from "react"
import { useLists } from "@/hooks/use-lists"

export default function ListsPage() {
  const currentUser = useUser()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { lists: publicLists, loading: publicLoading, error: publicError, fetchPublicLists } = useLists()

  useEffect(() => {
    fetchPublicLists()
  }, [fetchPublicLists])

  const handleListCreated = () => {
    setShowCreateDialog(false)
  }

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lists</h1>
        <p className="text-muted-foreground">
          Discover movie lists created by the community and organize your own collections.
        </p>
      </div>

      {/* User lists section using UserLists component */}
      {currentUser && (
        <UserLists 
          userId={currentUser.id} 
          limit={3} 
          alwaysShowThree={true}
        />
      )}

      {/* Public lists section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-6">Public Lists</h2>
        
        {publicLoading ? (
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 border rounded-lg">
                <div className="h-16 w-16 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : publicError ? (
          <div className="text-center text-muted-foreground py-8">
            <p>Error loading lists: {publicError}</p>
          </div>
        ) : publicLists.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No public lists found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {publicLists.map((list) => (
              <ListCard key={list.id} list={list} />
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <CreateListDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onListCreated={handleListCreated}
      />
    </div>
  )
} 