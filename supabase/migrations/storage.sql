-- Cria o bucket para imagens de perfil
insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true);

-- Permite que usuários autenticados façam upload de imagens
create policy "Usuários autenticados podem fazer upload de imagens"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-images' and
    auth.role() = 'authenticated'
  );

-- Permite que qualquer um veja as imagens
create policy "Qualquer um pode ver imagens"
  on storage.objects for select
  using (bucket_id = 'profile-images');

-- Permite que usuários deletem suas próprias imagens
create policy "Usuários podem deletar suas próprias imagens"
  on storage.objects for delete
  using (
    bucket_id = 'profile-images' and
    auth.uid() = owner
  );
