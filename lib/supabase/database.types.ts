export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      film_interactions: {
        Row: {
          release_date: any
          movie_title: string | undefined
          poster_path: string | undefined
          id: number
          user_id: string
          film_id: number
          rating: number | null
          review: string | null
          is_watched: boolean
          is_liked: boolean
          in_watchlist: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          film_id: number
          rating?: number | null
          review?: string | null
          is_watched?: boolean
          is_liked?: boolean
          in_watchlist?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          film_id?: number
          rating?: number | null
          review?: string | null
          is_watched?: boolean
          is_liked?: boolean
          in_watchlist?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      lists: {
        Row: {
          id: number
          user_id: string
          title: string
          bio: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          bio?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          bio?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      list_films: {
        Row: {
          id: number
          list_id: number
          film_id: number
          title: string
          poster_path: string | null
          backdrop_path: string | null
          release_date: string | null
          position: number
          added_at: string
        }
        Insert: {
          id?: number
          list_id: number
          film_id: number
          title: string
          poster_path?: string | null
          backdrop_path?: string | null
          release_date?: string | null
          position: number
          added_at?: string
        }
        Update: {
          id?: number
          list_id?: number
          film_id?: number
          title?: string
          poster_path?: string | null
          backdrop_path?: string | null
          release_date?: string | null
          position?: number
          added_at?: string
        }
      }
      users_favorite_films: {
        Row: {
          id: number
          user_id: string
          film_id: number
          title: string
          poster_path: string | null
          backdrop_path: string | null
          release_date: string | null
          position: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          film_id: number
          title: string
          poster_path?: string | null
          backdrop_path?: string | null
          release_date?: string | null
          position: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          film_id?: number
          title?: string
          poster_path?: string | null
          backdrop_path?: string | null
          release_date?: string | null
          position?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
