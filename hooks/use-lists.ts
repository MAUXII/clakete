import { useState, useCallback } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { Database } from '@/lib/supabase/database.types'
import { List, ListItem, CreateListData, UpdateListData, AddListItemData, ListMediaType } from '@/types/list'
import { slugify } from '@/lib/list-slug'
import { parseListBannerMeta } from '@/lib/list-banner'
import { FREE_PRIVATE_LIST_LIMIT, hasShiningAccess } from '@/lib/plans'

async function assertCanHavePrivateList(
  supabase: SupabaseClient<Database>,
  userId: string,
  opts?: { excludeListId?: string },
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('users')
    .select('plan, plan_status, plan_current_period_end')
    .eq('id', userId)
    .maybeSingle()

  if (
    hasShiningAccess({
      plan: profile?.plan,
      plan_status: profile?.plan_status,
      plan_current_period_end: profile?.plan_current_period_end,
    })
  ) {
    return true
  }

  let q = supabase
    .from('lists')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_public', false)

  if (opts?.excludeListId) {
    q = q.neq('id', opts.excludeListId)
  }

  const { count, error } = await q
  if (error) throw error

  if ((count ?? 0) >= FREE_PRIVATE_LIST_LIMIT) {
    toast.error(
      `Free plan allows ${FREE_PRIVATE_LIST_LIMIT} private lists. Upgrade to The Shining for unlimited.`,
    )
    return false
  }

  return true
}

async function uniqueSlugForListOwner(
  supabase: SupabaseClient<Database>,
  userId: string,
  title: string,
  excludeListId?: string,
): Promise<string> {
  const base = slugify(title)
  for (let n = 0; n < 100; n++) {
    const candidate = n === 0 ? base : `${base}-${n}`
    let q = supabase.from('lists').select('id').eq('user_id', userId).eq('slug', candidate)
    if (excludeListId) {
      q = q.neq('id', excludeListId)
    }
    const { data } = await q.maybeSingle()
    if (!data) return candidate
  }
  return `${base}-${Date.now()}`
}

export function useLists() {
  const supabase = useSupabaseClient<Database>()
  const user = useUser()
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enrichListsWithFilmMeta = useCallback(async (baseLists: { id: string }[]) => {
    if (baseLists.length === 0) {
      return { countsByListId: new Map<string, number>(), previewsByListId: new Map<string, (string | null)[]>() }
    }

    const listIds = baseLists.map((list) => list.id)
    const { data: filmRows, error: filmRowsError } = await supabase
      .from('list_items')
      .select('list_id, poster_path, position')
      .in('list_id', listIds)

    if (filmRowsError) throw filmRowsError

    const byListId = new Map<string, { poster_path: string | null; position: number }[]>()
    for (const row of filmRows || []) {
      const lid = String(row.list_id)
      const bucket = byListId.get(lid) ?? []
      bucket.push({
        poster_path: row.poster_path,
        position: row.position ?? 0,
      })
      byListId.set(lid, bucket)
    }

    const countsByListId = new Map<string, number>()
    const previewsByListId = new Map<string, (string | null)[]>()

    for (const [lid, rows] of byListId) {
      countsByListId.set(lid, rows.length)
      const ordered = [...rows].sort((a, b) => a.position - b.position)
      const top5: (string | null)[] = ordered.slice(0, 5).map((r) => {
        const p = r.poster_path?.trim()
        return p ? p : null
      })
      while (top5.length < 5) top5.push(null)
      previewsByListId.set(lid, top5)
    }

    return { countsByListId, previewsByListId }
  }, [supabase])

  // Buscar dados do usuário
  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, display_name, avatar_url')
        .eq('id', userId)
        .single()

      if (error) return null
      return data
    } catch (error) {
      return null
    }
  }, [supabase])

  // Buscar todas as listas do usuário
  const fetchUserLists = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('lists')
        .select('id, user_id, title, bio, is_public, slug, backdrop_path, banner_meta, feed_shared, feed_shared_at, feed_visibility, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) throw error

      if (data) {
        const ownerProfile = await fetchUserData(userId)
        const { countsByListId, previewsByListId } = await enrichListsWithFilmMeta(data)
        const listsWithCounts = data.map((list) => {
          const lid = String(list.id)
          return {
            ...list,
            banner_meta: parseListBannerMeta(list.banner_meta),
            userData: ownerProfile || undefined,
            films_count: countsByListId.get(lid) ?? 0,
            preview_posters: previewsByListId.get(lid) ?? [],
          }
        })

        setLists(listsWithCounts)
      }
    } catch (error) {
      setError('Erro ao carregar listas')
    } finally {
      setLoading(false)
    }
  }, [supabase, fetchUserData, enrichListsWithFilmMeta])

  // Buscar listas públicas
  const fetchPublicLists = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('lists')
        .select('id, user_id, title, bio, is_public, slug, backdrop_path, banner_meta, feed_shared, feed_shared_at, feed_visibility, created_at, updated_at')
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(20)

      if (error) throw error

      if (data) {
        const { countsByListId, previewsByListId } = await enrichListsWithFilmMeta(data)
        const userIds = [...new Set(data.map((list) => list.user_id))]
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds)

        if (usersError) throw usersError

        const userById = new Map((usersData || []).map((user) => [user.id, user]))
        const listsWithData = data.map((list) => {
          const lid = String(list.id)
          return {
            ...list,
            banner_meta: parseListBannerMeta(list.banner_meta),
            userData: userById.get(list.user_id) || undefined,
            films_count: countsByListId.get(lid) ?? 0,
            preview_posters: previewsByListId.get(lid) ?? [],
          }
        })

        setLists(listsWithData)
      }
    } catch (error) {
      setError('Erro ao carregar listas públicas')
    } finally {
      setLoading(false)
    }
  }, [supabase, enrichListsWithFilmMeta])

  // Criar nova lista
  const createList = useCallback(async (listData: CreateListData): Promise<List | null> => {
    if (!user) return null

    try {
      if (listData.is_public === false) {
        const ok = await assertCanHavePrivateList(supabase, user.id)
        if (!ok) return null
      }

      const slug = await uniqueSlugForListOwner(supabase, user.id, listData.title)
      const shareToFeed = Boolean(listData.feed_shared)
      const feedVisibility =
        listData.is_public === false
          ? "friends"
          : listData.feed_visibility === "public"
            ? "public"
            : "friends"

      const { data, error } = await supabase
        .from('lists')
        .insert({
          user_id: user.id,
          title: listData.title,
          bio: listData.bio || null,
          tags: listData.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [],
          is_public: listData.is_public !== false,
          slug,
          backdrop_path: listData.backdrop_path?.trim() || null,
          feed_shared: shareToFeed,
          feed_shared_at: shareToFeed ? new Date().toISOString() : null,
          feed_visibility: feedVisibility,
          ...(listData.banner_meta !== undefined
            ? {
                banner_meta:
                  listData.banner_meta as Database['public']['Tables']['lists']['Insert']['banner_meta'],
              }
            : {}),
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        const newList: List = {
          ...data,
          banner_meta: parseListBannerMeta(data.banner_meta),
          films_count: 0,
          preview_posters: [],
        }

        setLists(prev => [newList, ...prev])
        return newList
      }

      return null
    } catch (error) {
      setError('Erro ao criar lista')
      return null
    }
  }, [supabase, user])

  // Atualizar lista
  const updateList = useCallback(async (listId: string, data: UpdateListData): Promise<boolean> => {
    try {
      const payload: Record<string, unknown> = { ...data }
      const { data: row, error: rowErr } = await supabase
        .from('lists')
        .select('user_id, is_public')
        .eq('id', listId)
        .single()

      if (rowErr || !row?.user_id) {
        throw rowErr ?? new Error('Lista não encontrada')
      }

      if (data.is_public === false && row.is_public !== false) {
        const ok = await assertCanHavePrivateList(supabase, row.user_id, {
          excludeListId: listId,
        })
        if (!ok) return false
      }

      if (data.title !== undefined && data.slug === undefined) {
        payload.slug = await uniqueSlugForListOwner(supabase, row.user_id, data.title, listId)
      }

      if (data.feed_shared !== undefined) {
        payload.feed_shared = data.feed_shared
        payload.feed_shared_at = data.feed_shared
          ? new Date().toISOString()
          : null
      }
      if (data.is_public === false && data.feed_visibility === undefined) {
        payload.feed_visibility = "friends"
      } else if (data.feed_visibility !== undefined) {
        payload.feed_visibility =
          data.is_public === false ? "friends" : data.feed_visibility
      }

      const { error } = await supabase.from('lists').update(payload).eq('id', listId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao atualizar lista:', error)
      return false
    }
  }, [supabase])

  // Deletar lista
  const deleteList = useCallback(async (listId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId)

      if (error) throw error

      setLists(prev => prev.filter(list => list.id !== listId))
      return true
    } catch (error) {
      setError('Erro ao deletar lista')
      return false
    }
  }, [supabase])

  // Buscar itens (filme/série) de uma lista
  const fetchListItems = useCallback(async (listId: string): Promise<ListItem[]> => {
    try {
      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', listId)
        .order('position')

      if (error) throw error
      if (!data?.length) return []
      return data.map((row) => ({
        ...row,
        id: String(row.id),
      })) as ListItem[]
    } catch (error) {
      return []
    }
  }, [supabase])

  // Adicionar item à lista
  const addItemToList = useCallback(async (listId: string, itemData: AddListItemData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('list_items')
        .insert({
          list_id: listId,
          tmdb_id: itemData.tmdb_id,
          title: itemData.title,
          poster_path: itemData.poster_path ?? null,
          release_date: itemData.release_date && itemData.release_date.length > 0
            ? itemData.release_date
            : null,
          position: itemData.position,
          media_type: itemData.media_type ?? 'movie',
        })

      if (error) {
        console.error('Erro ao adicionar item à lista:', error.message, error)
        return false
      }
      return true
    } catch (error) {
      console.error('Erro ao adicionar item à lista:', error)
      return false
    }
  }, [supabase])

  // Remover item da lista
  const removeItemFromList = useCallback(async (
    listId: string,
    tmdbId: number,
    mediaType: ListMediaType = 'movie',
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('list_id', listId)
        .eq('tmdb_id', tmdbId)
        .eq('media_type', mediaType)

      if (error) throw error

      setLists(prev => prev.map(list => 
        list.id === listId 
          ? { ...list, films_count: Math.max(0, (list.films_count || 0) - 1) }
          : list
      ))

      return true
    } catch (error) {
      return false
    }
  }, [supabase])

  /** Curtidas: total na lista e se o visitante já curtiu. `list_id` no banco é uuid (string). Sem linhas = contagem 0, nunca é erro. */
  const fetchListLikesMeta = useCallback(
    async (listId: string, viewerUserId?: string | null) => {
      const { count, error: countErr } = await supabase
        .from('list_likes')
        .select('id', { count: 'exact', head: true })
        .eq('list_id', listId)

      if (countErr) {
        return { count: 0, liked: false }
      }

      let liked = false
      if (viewerUserId) {
        const { data: row, error: rowErr } = await supabase
          .from('list_likes')
          .select('id')
          .eq('list_id', listId)
          .eq('user_id', viewerUserId)
          .maybeSingle()

        if (!rowErr && row) liked = true
      }

      return { count: count ?? 0, liked }
    },
    [supabase],
  )

  const toggleListLike = useCallback(
    async (listId: string): Promise<{ count: number; liked: boolean } | null> => {
      if (!user?.id) return null

      try {
        const { data: existing, error: selErr } = await supabase
          .from('list_likes')
          .select('id')
          .eq('list_id', listId)
          .eq('user_id', user.id)
          .maybeSingle()

        if (selErr) return null

        if (existing) {
          const { error } = await supabase
            .from('list_likes')
            .delete()
            .eq('list_id', listId)
            .eq('user_id', user.id)
          if (error) return null
        } else {
          const { error } = await supabase.from('list_likes').insert({
            list_id: listId,
            user_id: user.id,
          })
          if (error) return null
        }

        const { count, error: cntErr } = await supabase
          .from('list_likes')
          .select('id', { count: 'exact', head: true })
          .eq('list_id', listId)

        let finalCount = count ?? 0
        if (cntErr) {
          const { data: rows } = await supabase.from('list_likes').select('id').eq('list_id', listId)
          finalCount = rows?.length ?? 0
        }

        return { count: finalCount, liked: !existing }
      } catch {
        return null
      }
    },
    [supabase, user?.id],
  )

  // Reordenar itens na lista
  const reorderListItems = useCallback(async (listId: string, items: ListItem[]): Promise<boolean> => {
    try {
      await supabase
        .from('list_items')
        .delete()
        .eq('list_id', listId)

      if (items.length > 0) {
        const rows = items.map((item) => ({
          list_id: listId,
          tmdb_id: item.tmdb_id,
          title: item.title,
          poster_path: item.poster_path,
          release_date: item.release_date,
          position: item.position,
          media_type: item.media_type ?? 'movie',
        }))

        const { error } = await supabase
          .from('list_items')
          .insert(rows)

        if (error) throw error
      }

      return true
    } catch (error) {
      return false
    }
  }, [supabase])

  return {
    lists,
    loading,
    error,
    fetchUserLists,
    fetchPublicLists,
    createList,
    updateList,
    deleteList,
    fetchListItems,
    addItemToList,
    removeItemFromList,
    reorderListItems,
    fetchListLikesMeta,
    toggleListLike,
  }
} 