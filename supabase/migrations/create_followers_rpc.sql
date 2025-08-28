-- Função RPC para criar a tabela de seguidores
-- Esta função permite que a aplicação crie a tabela se ela não existir
CREATE OR REPLACE FUNCTION public.create_followers_table()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Verificar se a tabela já existe
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' 
    AND table_name = 'user_followers'
  ) INTO table_exists;
  
  -- Se a tabela não existir, criar
  IF NOT table_exists THEN
    -- Criar tabela de seguidores
    CREATE TABLE public.user_followers (
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
    CREATE INDEX idx_user_followers_user_id ON public.user_followers(user_id);
    CREATE INDEX idx_user_followers_follower_id ON public.user_followers(follower_id);
    
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
      
    RETURN 'Tabela de seguidores criada com sucesso';
  ELSE
    RETURN 'Tabela de seguidores já existe';
  END IF;
END;
$$; 