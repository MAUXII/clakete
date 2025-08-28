-- Migração para corrigir políticas de storage
-- Esta migração adiciona políticas que estavam faltando e corrige as existentes

-- 1. Adicionar política de UPDATE para permitir que usuários atualizem suas próprias imagens
CREATE POLICY "Usuários podem atualizar suas próprias imagens"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = owner
  );

-- 2. Corrigir a política de DELETE para ser mais permissiva para banners de lista
-- Primeiro, remover a política antiga
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias imagens" ON storage.objects;

-- Criar nova política mais permissiva
CREATE POLICY "Usuários autenticados podem deletar imagens"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-images' AND
    auth.role() = 'authenticated'
  );

-- 3. Adicionar política para permitir que usuários vejam todas as imagens do bucket
-- (já existe, mas vamos garantir que está correta)
DROP POLICY IF EXISTS "Qualquer um pode ver imagens" ON storage.objects;

CREATE POLICY "Qualquer um pode ver imagens"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

-- 4. Garantir que a política de INSERT está correta
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de imagens" ON storage.objects;

CREATE POLICY "Usuários autenticados podem fazer upload de imagens"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.role() = 'authenticated'
  );

-- 5. Verificar se o bucket existe, se não, criar
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;










