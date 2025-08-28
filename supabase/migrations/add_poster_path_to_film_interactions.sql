-- Adiciona a coluna poster_path à tabela film_interactions
ALTER TABLE film_interactions
ADD COLUMN poster_path TEXT;

-- Adiciona um comentário explicativo
COMMENT ON COLUMN film_interactions.poster_path IS 'Caminho do poster do filme no TMDB'; 