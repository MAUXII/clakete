-- Script para criar as tabelas de listas no Supabase
-- Este script deve ser executado no SQL Editor do Console Supabase

-- Criar tabela de listas
CREATE TABLE IF NOT EXISTS public.lists (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  bio TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar tabela de filmes nas listas
CREATE TABLE IF NOT EXISTS public.list_films (
  id BIGSERIAL PRIMARY KEY,
  list_id BIGINT NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  film_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  backdrop_path TEXT,
  release_date TEXT,
  position INTEGER NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(list_id, position)
);

-- Adicionar comentários
COMMENT ON TABLE public.lists IS 'Armazena listas de filmes criadas pelos usuários';
COMMENT ON COLUMN public.lists.user_id IS 'ID do usuário que criou a lista';
COMMENT ON COLUMN public.lists.title IS 'Título da lista';
COMMENT ON COLUMN public.lists.bio IS 'Descrição/bio da lista';
COMMENT ON COLUMN public.lists.is_public IS 'Se a lista é pública ou privada';

COMMENT ON TABLE public.list_films IS 'Armazena filmes dentro das listas';
COMMENT ON COLUMN public.list_films.list_id IS 'ID da lista à qual o filme pertence';
COMMENT ON COLUMN public.list_films.film_id IS 'ID do filme no TMDB';
COMMENT ON COLUMN public.list_films.position IS 'Posição do filme na lista';

-- Adicionar índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON public.lists(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_public ON public.lists(is_public);
CREATE INDEX IF NOT EXISTS idx_list_films_list_id ON public.list_films(list_id);
CREATE INDEX IF NOT EXISTS idx_list_films_position ON public.list_films(list_id, position);

-- Configurar RLS (Row Level Security)
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_films ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança para lists
-- Qualquer pessoa pode ver listas públicas
CREATE POLICY "Qualquer pessoa pode ver listas públicas"
  ON public.lists
  FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Apenas o próprio usuário pode inserir suas listas
CREATE POLICY "Usuários podem inserir suas próprias listas"
  ON public.lists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Apenas o próprio usuário pode atualizar suas listas
CREATE POLICY "Usuários podem atualizar suas próprias listas"
  ON public.lists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Apenas o próprio usuário pode deletar suas listas
CREATE POLICY "Usuários podem deletar suas próprias listas"
  ON public.lists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Criar políticas de segurança para list_films
-- Qualquer pessoa pode ver filmes de listas públicas
CREATE POLICY "Qualquer pessoa pode ver filmes de listas públicas"
  ON public.list_films
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE lists.id = list_films.list_id 
      AND (lists.is_public = true OR lists.user_id = auth.uid())
    )
  );

-- Apenas o dono da lista pode inserir filmes
CREATE POLICY "Dono da lista pode inserir filmes"
  ON public.list_films
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE lists.id = list_films.list_id 
      AND lists.user_id = auth.uid()
    )
  );

-- Apenas o dono da lista pode atualizar filmes
CREATE POLICY "Dono da lista pode atualizar filmes"
  ON public.list_films
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE lists.id = list_films.list_id 
      AND lists.user_id = auth.uid()
    )
  );

-- Apenas o dono da lista pode deletar filmes
CREATE POLICY "Dono da lista pode deletar filmes"
  ON public.list_films
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE lists.id = list_films.list_id 
      AND lists.user_id = auth.uid()
    )
  );

-- Função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela lists
CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON public.lists
  FOR EACH ROW
  EXECUTE PROCEDURE update_lists_updated_at(); 