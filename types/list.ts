export interface List {
  id: string
  user_id: string
  title: string
  bio?: string
  slug?: string | null
  backdrop_path?: string
  is_public: boolean
  created_at: string
  updated_at: string
  userData?: {
    username?: string
    display_name?: string
    avatar_url?: string
  }
  films_count?: number
  /** Primeiros 5 itens da lista (ordem), paths TMDB; null se não houver poster. */
  preview_posters?: (string | null)[]
}

export type ListMediaType = "movie" | "tv"

export interface ListItem {
  id: string
  list_id: string
  tmdb_id: number
  title: string
  poster_path?: string
  release_date?: string
  position: number
  added_at: string
  /** movie = TMDB movie id em tmdb_id; tv = TMDB tv id em tmdb_id */
  media_type?: ListMediaType
}

/** @deprecated Use `ListItem` */
export type ListFilm = ListItem

export interface CreateListData {
  title: string
  bio?: string
  backdrop_path?: string
  is_public: boolean
}

export interface UpdateListData {
  title?: string
  bio?: string
  backdrop_path?: string
  is_public?: boolean
  slug?: string
}

export interface AddListItemData {
  tmdb_id: number
  title: string
  poster_path?: string
  release_date?: string
  position: number
  media_type?: ListMediaType
}

/** @deprecated Use `AddListItemData` */
export type AddFilmToListData = AddListItemData
