export interface List {
  id: string
  user_id: string
  title: string
  bio?: string
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
}

export interface ListFilm {
  id: string
  list_id: string
  film_id: number
  title: string
  poster_path?: string
  release_date?: string
  position: number
  added_at: string
}

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
}

export interface AddFilmToListData {
  film_id: number
  title: string
  poster_path?: string
  release_date?: string
  position: number
} 