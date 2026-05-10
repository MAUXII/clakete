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
      items_interactions: {
        Row: {
          release_date: string | null
          movie_title: string | undefined
          poster_path: string | undefined
          id: number
          user_id: string
          tmdb_id: number
          media_type: string
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
          tmdb_id: number
          media_type?: string
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
          tmdb_id?: number
          media_type?: string
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
          id: string
          user_id: string
          title: string
          bio: string | null
          tags: string[]
          slug: string | null
          backdrop_path: string | null
          banner_meta: Json | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          bio?: string | null
          tags?: string[]
          slug?: string | null
          backdrop_path?: string | null
          banner_meta?: Json | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          bio?: string | null
          tags?: string[]
          slug?: string | null
          backdrop_path?: string | null
          banner_meta?: Json | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      list_items: {
        Row: {
          id: number
          list_id: string
          tmdb_id: number
          title: string
          poster_path: string | null
          backdrop_path: string | null
          release_date: string | null
          position: number
          added_at: string
          media_type: string
        }
        Insert: {
          id?: number
          list_id: string
          tmdb_id: number
          title: string
          poster_path?: string | null
          backdrop_path?: string | null
          release_date?: string | null
          position: number
          added_at?: string
          media_type?: string
        }
        Update: {
          id?: number
          list_id?: string
          tmdb_id?: number
          title?: string
          poster_path?: string | null
          backdrop_path?: string | null
          release_date?: string | null
          position?: number
          added_at?: string
          media_type?: string
        }
      }
      list_likes: {
        Row: {
          id: string
          list_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          list_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          user_id?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          username: string
          email: string | null
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          banner_url: string | null
          avatar_meta: Json | null
          banner_meta: Json | null
          website_url: string | null
          twitter_url: string | null
          instagram_url: string | null
          home_preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email?: string | null
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          avatar_meta?: Json | null
          banner_meta?: Json | null
          website_url?: string | null
          twitter_url?: string | null
          instagram_url?: string | null
          home_preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string | null
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          avatar_meta?: Json | null
          banner_meta?: Json | null
          website_url?: string | null
          twitter_url?: string | null
          instagram_url?: string | null
          home_preferences?: Json | null
          created_at?: string
          updated_at?: string
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
