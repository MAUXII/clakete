import { useState, useCallback } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Database } from '@/lib/supabase/database.types'
import { List, ListFilm, CreateListData, UpdateListData, AddFilmToListData } from '@/types/list'

export function useLists() {
  const supabase = useSupabaseClient<Database>()
  const user = useUser()
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) throw error

      if (data) {
        // Buscar contagem de filmes para cada lista
        const listsWithCounts = await Promise.all(
          data.map(async (list) => {
            const { count: filmsCount } = await supabase
              .from('list_films')
              .select('*', { count: 'exact', head: true })
              .eq('list_id', list.id)

            return {
              ...list,
              films_count: filmsCount || 0
            }
          })
        )

        setLists(listsWithCounts)
      }
    } catch (error) {
      setError('Erro ao carregar listas')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Buscar listas públicas
  const fetchPublicLists = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(20)

      if (error) throw error

      if (data) {
        // Buscar dados do usuário e contagem de filmes
        const listsWithData = await Promise.all(
          data.map(async (list) => {
            const [userData, { count: filmsCount }] = await Promise.all([
              fetchUserData(list.user_id),
              supabase
                .from('list_films')
                .select('*', { count: 'exact', head: true })
                .eq('list_id', list.id)
            ])

            return {
              ...list,
              userData: userData || undefined,
              films_count: filmsCount || 0
            }
          })
        )

        setLists(listsWithData)
      }
    } catch (error) {
      setError('Erro ao carregar listas públicas')
    } finally {
      setLoading(false)
    }
  }, [supabase, fetchUserData])

  // Criar nova lista
  const createList = useCallback(async (listData: CreateListData): Promise<List | null> => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('lists')
        .insert({
          user_id: user.id,
          title: listData.title,
          bio: listData.bio || null,
          is_public: listData.is_public !== false
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        const newList: List = {
          ...data,
          films_count: 0
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
      console.log('🔄 Atualizando lista no banco:', listId, 'com dados:', data);
      
      const { error } = await supabase
        .from('lists')
        .update(data)
        .eq('id', listId)

      if (error) {
        console.error('❌ Erro do Supabase ao atualizar lista:', error);
        throw error;
      }
      
      console.log('✅ Lista atualizada com sucesso no banco');
      return true
    } catch (error) {
      console.error('❌ Erro ao atualizar lista:', error);
      console.error('❌ Tipo do erro:', typeof error);
      console.error('❌ Mensagem do erro:', error instanceof Error ? error.message : 'Erro desconhecido');
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

  // Buscar filmes de uma lista
  const fetchListFilms = useCallback(async (listId: string): Promise<ListFilm[]> => {
    try {
      const { data, error } = await supabase
        .from('list_films')
        .select('*')
        .eq('list_id', listId)
        .order('position')

      if (error) throw error
      return data || []
    } catch (error) {
      return []
    }
  }, [supabase])

  // Adicionar filme à lista
  const addFilmToList = useCallback(async (listId: string, filmData: AddFilmToListData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('list_films')
        .insert({
          list_id: listId,
          film_id: filmData.film_id,
          title: filmData.title,
          poster_path: filmData.poster_path,
          release_date: filmData.release_date,
          position: filmData.position
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao adicionar filme à lista:', error)
      return false
    }
  }, [supabase])

  // Remover filme da lista
  const removeFilmFromList = useCallback(async (listId: string, filmId: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('list_films')
        .delete()
        .eq('list_id', listId)
        .eq('film_id', filmId)

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

  // Reordenar filmes na lista
  const reorderListFilms = useCallback(async (listId: string, films: ListFilm[]): Promise<boolean> => {
    try {
      // Deletar todos os filmes da lista
      await supabase
        .from('list_films')
        .delete()
        .eq('list_id', listId)

      // Inserir novamente com as novas posições
      if (films.length > 0) {
        const filmsToInsert = films.map(film => ({
          list_id: listId,
          film_id: film.film_id,
          title: film.title,
          poster_path: film.poster_path,
          release_date: film.release_date,
          position: film.position
        }))

        const { error } = await supabase
          .from('list_films')
          .insert(filmsToInsert)

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
    fetchListFilms,
    addFilmToList,
    removeFilmFromList,
    reorderListFilms
  }
} 