-- Script para verificar e corrigir o storage (VERSÃO SEGURA)
-- Execute este script no Supabase Console para garantir que tudo está configurado

-- 1. Verificar se o bucket existe (APENAS VERIFICAÇÃO)
SELECT 
  id, 
  name, 
  public,
  CASE 
    WHEN id = 'profile-images' THEN '✅ Bucket profile-images existe'
    ELSE '❌ Bucket profile-images NÃO existe'
  END as status
FROM storage.buckets 
WHERE id = 'profile-images';

-- 2. Verificar políticas existentes
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

-- 3. Criar políticas apenas se não existirem
DO $$
BEGIN
  -- Política para INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Usuários autenticados podem fazer upload de imagens'
  ) THEN
    CREATE POLICY "Usuários autenticados podem fazer upload de imagens"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'profile-images' AND
        auth.role() = 'authenticated'
      );
    RAISE NOTICE 'Política de INSERT criada';
  ELSE
    RAISE NOTICE 'Política de INSERT já existe';
  END IF;

  -- Política para SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Qualquer um pode ver imagens'
  ) THEN
    CREATE POLICY "Qualquer um pode ver imagens"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'profile-images');
    RAISE NOTICE 'Política de SELECT criada';
  ELSE
    RAISE NOTICE 'Política de SELECT já existe';
  END IF;

  -- Política para DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Usuários podem deletar suas próprias imagens'
  ) THEN
    CREATE POLICY "Usuários podem deletar suas próprias imagens"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'profile-images' AND
        auth.uid()::text = owner
      );
    RAISE NOTICE 'Política de DELETE criada';
  ELSE
    RAISE NOTICE 'Política de DELETE já existe';
  END IF;
END $$; 