-- Script para corrigir políticas de storage do Supabase
-- Execute este script no SQL Editor do Supabase Console

-- 1. Verificar se o bucket existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-images') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('profile-images', 'profile-images', true);
    RAISE NOTICE 'Bucket profile-images criado';
  ELSE
    RAISE NOTICE 'Bucket profile-images já existe';
  END IF;
END $$;

-- 2. Remover políticas antigas que podem estar causando conflitos
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias imagens" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias imagens" ON storage.objects;
DROP POLICY IF EXISTS "Qualquer um pode ver imagens" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de imagens" ON storage.objects;

-- 3. Criar novas políticas mais permissivas e robustas

-- Política para INSERT (upload)
CREATE POLICY "Usuários autenticados podem fazer upload de imagens"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.role() = 'authenticated'
  );

-- Política para SELECT (visualizar)
CREATE POLICY "Qualquer um pode ver imagens"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

-- Política para UPDATE (atualizar)
CREATE POLICY "Usuários autenticados podem atualizar imagens"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-images' AND
    auth.role() = 'authenticated'
  );

-- Política para DELETE (remover)
CREATE POLICY "Usuários autenticados podem deletar imagens"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-images' AND
    auth.role() = 'authenticated'
  );

-- 4. Verificar se as políticas foram criadas
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  CASE 
    WHEN policyname LIKE '%profile-images%' THEN '✅ Política para profile-images'
    ELSE '❌ Política não encontrada'
  END as status
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%profile-images%';

-- 5. Verificar bucket
SELECT 
  id, 
  name, 
  public,
  CASE 
    WHEN id = 'profile-images' THEN '✅ Bucket profile-images configurado'
    ELSE '❌ Bucket profile-images NÃO encontrado'
  END as status
FROM storage.buckets 
WHERE id = 'profile-images';










