-- Script para criar as tabelas de listas no Supabase (versão limpa)
-- Este script remove as tabelas existentes primeiro para evitar conflitos

-- Remover tabelas existentes (se existirem)
DROP TABLE IF EXISTS public.list_films CASCADE;
DROP TABLE IF EXISTS public.lists CASCADE;

-- Remover função e trigger se existirem
DROP FUNCTION IF EXISTS update_lists_updated_at() CASCADE;

-- Habilitar extensão uuid-ossp se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de listas
CREATE TABLE public.lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  bio TEXT,
  backdrop_path TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar tabela de filmes nas listas
CREATE TABLE public.list_films (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  film_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
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
COMMENT ON COLUMN public.lists.backdrop_path IS 'Caminho da imagem de fundo da lista';
COMMENT ON COLUMN public.lists.is_public IS 'Se a lista é pública ou privada';

COMMENT ON TABLE public.list_films IS 'Armazena filmes dentro das listas';
COMMENT ON COLUMN public.list_films.list_id IS 'ID da lista à qual o filme pertence';
COMMENT ON COLUMN public.list_films.film_id IS 'ID do filme no TMDB';
COMMENT ON COLUMN public.list_films.position IS 'Posição do filme na lista';

-- Adicionar índices
CREATE INDEX idx_lists_user_id ON public.lists(user_id);
CREATE INDEX idx_lists_public ON public.lists(is_public);
CREATE INDEX idx_list_films_list_id ON public.list_films(list_id);
CREATE INDEX idx_list_films_position ON public.list_films(list_id, position);

-- Configurar RLS
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_films ENABLE ROW LEVEL SECURITY;

-- Políticas para lists
CREATE POLICY "Qualquer pessoa pode ver listas públicas"
  ON public.lists FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias listas"
  ON public.lists FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias listas"
  ON public.lists FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias listas"
  ON public.lists FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para list_films
CREATE POLICY "Qualquer pessoa pode ver filmes de listas públicas"
  ON public.list_films FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE lists.id = list_films.list_id 
      AND (lists.is_public = true OR lists.user_id = auth.uid())
    )
  );

CREATE POLICY "Dono da lista pode inserir filmes"
  ON public.list_films FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE lists.id = list_films.list_id 
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Dono da lista pode atualizar filmes"
  ON public.list_films FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE lists.id = list_films.list_id 
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Dono da lista pode deletar filmes"
  ON public.list_films FOR DELETE TO authenticated
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