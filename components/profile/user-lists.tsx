"use client"

import { useEffect, useState } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { Database } from "@/lib/supabase/database.types"
import { List } from "@/types/list"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, MoreVertical } from "lucide-react"
import { useLists } from "@/hooks/use-lists"
import { CreateListDialog } from "./create-list-dialog"
import { EditListDialog } from "./edit-list-dialog"
import { UserListCard } from "../lists/user-list-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserListsProps {
  userId?: string
  limit?: number
  onLandingPage?: boolean
  alwaysShowThree?: boolean
  gridCols?: number
}

export function UserLists({ userId, limit = 6, onLandingPage, alwaysShowThree = false, gridCols = 3 }: UserListsProps) {

  const loggedInUser = useUser()
  const { lists, loading, error, fetchUserLists, deleteList } = useLists()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingList, setEditingList] = useState<List | null>(null)
  
  // Use o userId passado como prop ou o id do usuário logado
  const targetUserId = userId || (loggedInUser?.id || '')
  const canEdit = loggedInUser?.id === targetUserId

  useEffect(() => {
    if (targetUserId) {
      fetchUserLists(targetUserId)
    }
  }, [targetUserId, fetchUserLists])

  const handleDeleteList = async (listId: string) => {
    if (confirm('Tem certeza que deseja deletar esta lista?')) {
      const success = await deleteList(listId)
      if (success) {
        // A lista já foi removida do estado pelo hook
        console.log('Lista deletada com sucesso')
      }
    }
  }

  if (loading) {
    return (
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
    )
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground">
        <p>Erro ao carregar listas: {error}</p>
      </div>
    )
  }

  const displayLists = lists.slice(0, limit)

  // Se alwaysShowThree é true, sempre mostrar divs baseado no gridCols
  if (alwaysShowThree) {
    return (
      <div className="">
        <div className="flex flex-col">
         <h2 className="font-medium text-start text-muted-foreground/50 text-sm uppercase">Your Lists</h2>
          <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
         
        </div>
        
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${gridCols} gap-4`}>
          {Array.from({ length: gridCols }).map((_, index) => {
            const list = displayLists[index]
            
            if (list) {
              // Se existe uma lista, mostrar o card da lista
              return (
                <div key={list.id} className="group relative">
                  <UserListCard list={list} />
                  
                  {/* Menu de 3 pontinhos */}
                  {canEdit && (
                    <div className="absolute bottom-10 right-2 group-hover:opacity-100 transition-opacity z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          
                                                     <DropdownMenuItem 
                             onClick={() => handleDeleteList(list.id)}
                             className="text-destructive focus:text-destructive"
                           >
                             <Trash2 className="h-4 w-4 mr-2" />
                             Delete List
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              )
            } else {
                             // Se não existe lista, mostrar botão para criar apenas se for o próprio perfil
               if (canEdit) {
                 return (
                   <div key={`empty-${index}`} className="aspect-video border-2 border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center hover:border-muted-foreground/50 transition-colors w-full">
                     <Button
                       variant="ghost"
                       onClick={() => setShowCreateDialog(true)}
                       className="flex flex-col items-center gap-2 h-full w-full text-muted-foreground hover:text-foreground"
                     >
                       <Plus className="h-8 w-8" />
                       <span className="text-sm">Create New List</span>
                     </Button>
                   </div>
                 )
               } else {
                 // Se não é o próprio perfil, mostrar espaço vazio sem botão
                 return (
                   <div key={`empty-${index}`} className="aspect-video border-2 border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center w-full">
                     <span className="text-sm text-muted-foreground/50">No list</span>
                   </div>
                 )
               }
            }
          })}
        </div>

        {/* Diálogos */}
        <CreateListDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onListCreated={() => {
            setShowCreateDialog(false)
            fetchUserLists(targetUserId)
          }}
        />

        {editingList && (
          <EditListDialog
            list={editingList}
            open={!!editingList}
            onOpenChange={(open) => {
              if (!open) {
                setEditingList(null)
              }
            }}
            onListUpdated={() => {
              setEditingList(null)
              fetchUserLists(targetUserId)
            }}
          />
        )}
      </div>
    )
  }

  // Comportamento original para quando alwaysShowThree é false
  return (
    <div className="">
      <div className="flex items-end justify-between mb-1 ">
        {onLandingPage ? (
          <h2 className="font-medium text-muted-foreground/50 text-sm uppercase">Lists</h2>
        ) : (
          <h2 className="font-medium text-muted-foreground/50 text-sm uppercase">Lists</h2>
        )}
        
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center justify-center aspect-square h-8 w-8 gap-2"
          >
            <Plus className="h-4 w-4" />
            
          </Button>
        )}
      </div>
      
      <div className="bg-muted-foreground/10 w-full h-[0.3px] mb-4"></div>

             {displayLists.length === 0 ? (
         <div className="text-center text-muted-foreground py-8">
           <p>No lists found</p>
           {canEdit && (
             <Button
               variant="outline"
               size="sm"
               onClick={() => setShowCreateDialog(true)}
               className="mt-2"
             >
               Create first list
             </Button>
           )}
         </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {displayLists.map((list) => (
            <div key={list.id} className="group relative flex">
              <UserListCard list={list} />
              
              {/* Menu de 3 pontinhos */}
              {canEdit && (
                <div className="absolute bottom-10 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                                                                                             <DropdownMenuItem 
                           onSelect={() => handleDeleteList(list.id)}
                           className="text-destructive focus:text-destructive"
                         >
                           <Trash2 className="h-4 w-4 mr-2" />
                           Delete List
                         </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Diálogos */}
      <CreateListDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onListCreated={() => {
          setShowCreateDialog(false)
          fetchUserLists(targetUserId)
        }}
      />

      {editingList && (
        <EditListDialog
          list={editingList}
          open={!!editingList}
          onOpenChange={(open) => {
            if (!open) {
              setEditingList(null)
            }
          }}
          onListUpdated={() => {
            setEditingList(null)
            fetchUserLists(targetUserId)
          }}
        />
      )}
    </div>
  )
} 