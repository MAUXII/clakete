-- Criar tabela de interações com filmes
CREATE TABLE IF NOT EXISTS public.film_interactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    film_id INTEGER NOT NULL,
    is_watched BOOLEAN DEFAULT false,
    watched_at TIMESTAMPTZ,
    is_liked BOOLEAN DEFAULT false,
    liked_at TIMESTAMPTZ,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    in_watchlist BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, film_id)
);

-- Adicionar comentários
COMMENT ON TABLE public.film_interactions IS 'Armazena interações dos usuários com filmes';
COMMENT ON COLUMN public.film_interactions.user_id IS 'ID do usuário';
COMMENT ON COLUMN public.film_interactions.film_id IS 'ID do filme no TMDB';
COMMENT ON COLUMN public.film_interactions.is_watched IS 'Indica se o filme foi assistido';
COMMENT ON COLUMN public.film_interactions.watched_at IS 'Data e hora em que o filme foi assistido';
COMMENT ON COLUMN public.film_interactions.is_liked IS 'Indica se o filme foi curtido';
COMMENT ON COLUMN public.film_interactions.liked_at IS 'Data e hora em que o filme foi curtido';
COMMENT ON COLUMN public.film_interactions.rating IS 'Avaliação do filme (1-5)';
COMMENT ON COLUMN public.film_interactions.review IS 'Review do filme';
COMMENT ON COLUMN public.film_interactions.in_watchlist IS 'Indica se o filme está na lista para assistir';

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_film_interactions_user_id ON public.film_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_film_interactions_film_id ON public.film_interactions(film_id);

-- Configurar RLS
ALTER TABLE public.film_interactions ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
-- Qualquer pessoa pode ver interações
CREATE POLICY "Qualquer pessoa pode ver interações"
    ON public.film_interactions
    FOR SELECT
    USING (true);

-- Usuários podem inserir suas próprias interações
CREATE POLICY "Usuários podem inserir suas próprias interações"
    ON public.film_interactions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias interações
CREATE POLICY "Usuários podem atualizar suas próprias interações"
    ON public.film_interactions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Usuários podem excluir suas próprias interações
CREATE POLICY "Usuários podem excluir suas próprias interações"
    ON public.film_interactions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id); 