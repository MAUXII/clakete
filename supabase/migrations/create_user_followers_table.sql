-- Script para criar a tabela de seguidores no Supabase
-- Este script deve ser executado no SQL Editor do Console Supabase

-- Criar tabela de seguidores
CREATE TABLE IF NOT EXISTS public.user_followers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, follower_id)
);

-- Adicionar comentários
COMMENT ON TABLE public.user_followers IS 'Armazena relações de seguidores entre usuários';
COMMENT ON COLUMN public.user_followers.user_id IS 'Usuário que está sendo seguido';
COMMENT ON COLUMN public.user_followers.follower_id IS 'Usuário que está seguindo';

-- Adicionar índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_user_followers_user_id ON public.user_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_followers_follower_id ON public.user_followers(follower_id);

-- Configurar RLS (Row Level Security)
ALTER TABLE public.user_followers ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
-- Qualquer pessoa pode ver quem segue quem
CREATE POLICY "Qualquer pessoa pode ver seguidores"
  ON public.user_followers
  FOR SELECT
  USING (true);

-- Apenas usuários autenticados podem começar a seguir alguém
CREATE POLICY "Usuários autenticados podem seguir outros"
  ON public.user_followers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

-- Usuários só podem deixar de seguir a si mesmos
CREATE POLICY "Usuários podem deixar de seguir"
  ON public.user_followers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- Função para contar seguidores
CREATE OR REPLACE FUNCTION public.count_followers(user_uuid UUID)
RETURNS BIGINT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT COUNT(*)
  FROM public.user_followers
  WHERE user_id = user_uuid;
$$;

-- Função para contar seguidos
CREATE OR REPLACE FUNCTION public.count_following(user_uuid UUID)
RETURNS BIGINT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT COUNT(*)
  FROM public.user_followers
  WHERE follower_id = user_uuid;
$$;

-- Função para verificar se um usuário segue outro
CREATE OR REPLACE FUNCTION public.is_following(follower UUID, followed UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_followers
    WHERE follower_id = follower AND user_id = followed
  );
$$; 