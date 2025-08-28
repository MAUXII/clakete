-- Adiciona a coluna banner_url na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url TEXT;
