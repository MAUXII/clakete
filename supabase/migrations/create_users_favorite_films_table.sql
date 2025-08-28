-- Script para criar a tabela de filmes favoritos no Supabase
-- Este script deve ser executado no SQL Editor do Console Supabase

-- Criar tabela de filmes favoritos
CREATE TABLE IF NOT EXISTS public.users_favorite_films (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  backdrop_path TEXT,
  release_date TEXT,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, position)
);

-- Adicionar comentários
COMMENT ON TABLE public.users_favorite_films IS 'Armazena filmes favoritos dos usuários';
COMMENT ON COLUMN public.users_favorite_films.user_id IS 'ID do usuário que favoritou o filme';
COMMENT ON COLUMN public.users_favorite_films.film_id IS 'ID do filme no TMDB';
COMMENT ON COLUMN public.users_favorite_films.position IS 'Posição do filme na lista de favoritos';

-- Adicionar índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_users_favorite_films_user_id ON public.users_favorite_films(user_id);
CREATE INDEX IF NOT EXISTS idx_users_favorite_films_film_id ON public.users_favorite_films(film_id);

-- Configurar RLS (Row Level Security)
ALTER TABLE public.users_favorite_films ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
-- Qualquer pessoa pode ver filmes favoritos de qualquer usuário
CREATE POLICY "Qualquer pessoa pode ver filmes favoritos"
  ON public.users_favorite_films
  FOR SELECT
  USING (true);

-- Apenas o próprio usuário pode inserir seus filmes favoritos
CREATE POLICY "Usuários podem inserir seus próprios filmes favoritos"
  ON public.users_favorite_films
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Apenas o próprio usuário pode atualizar seus filmes favoritos
CREATE POLICY "Usuários podem atualizar seus próprios filmes favoritos"
  ON public.users_favorite_films
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Apenas o próprio usuário pode excluir seus filmes favoritos
CREATE POLICY "Usuários podem excluir seus próprios filmes favoritos"
  ON public.users_favorite_films
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id); 