-- Script para atualizar as tabelas de listas
-- Remove backdrop_path de list_films e adiciona backdrop_path em lists

-- Adicionar backdrop_path na tabela lists (se não existir)
ALTER TABLE public.lists ADD COLUMN IF NOT EXISTS backdrop_path TEXT;

-- Remover backdrop_path da tabela list_films (se existir)
ALTER TABLE public.list_films DROP COLUMN IF EXISTS backdrop_path;

-- Adicionar comentário para a nova coluna
COMMENT ON COLUMN public.lists.backdrop_path IS 'Caminho da imagem de fundo da lista'; 