# Correção do Problema de Upload de Banner das Listas

## Problema
O erro `❌ Erro no upload: {}` está ocorrendo ao tentar atualizar o banner de uma lista. Isso acontece devido a políticas de segurança do Supabase Storage que estão muito restritivas.

## Solução

### 1. Executar o Script de Correção

Acesse o **Supabase Console** do seu projeto e execute o script `supabase/apply_storage_fix.sql` no **SQL Editor**.

Este script irá:
- ✅ Verificar se o bucket `profile-images` existe
- ✅ Remover políticas antigas conflitantes
- ✅ Criar novas políticas mais permissivas
- ✅ Verificar se tudo foi configurado corretamente

### 2. Melhorias Implementadas no Código

#### ImageEditDialog (`components/profile/avatar-edit-dialog.tsx`)
- 🔄 **Estratégia de upload mais robusta**: Remove arquivo antigo antes de fazer upload do novo
- 🔄 **Fallback com nome único**: Se houver conflito, usa timestamp para gerar nome único
- 🔄 **Melhor tratamento de erros**: Logs detalhados e mensagens amigáveis para o usuário

#### Hook useLists (`hooks/use-lists.ts`)
- 🔄 **Logs de debug**: Informações detalhadas sobre o processo de atualização
- 🔄 **Tratamento de erro melhorado**: Captura e exibe erros específicos

#### Página da Lista (`app/lists/[id]/page.tsx`)
- 🔄 **Logs de debug**: Rastreamento completo do processo de atualização do banner

### 3. Como Funciona Agora

1. **Seleção de Imagem**: Usuário seleciona uma imagem de um filme
2. **Crop da Imagem**: Usuário ajusta a imagem no cropper
3. **Upload Inteligente**:
   - Verifica se já existe um banner para a lista
   - Remove o arquivo antigo se existir
   - Faz upload do novo arquivo
   - Se houver conflito, usa nome único com timestamp
4. **Atualização do Banco**: Atualiza o campo `backdrop_path` na tabela `lists`
5. **Atualização da UI**: Mostra o novo banner imediatamente

### 4. Políticas de Storage Corrigidas

As novas políticas permitem:
- ✅ **Upload**: Qualquer usuário autenticado pode fazer upload
- ✅ **Visualização**: Qualquer pessoa pode ver as imagens
- ✅ **Atualização**: Usuários autenticados podem atualizar imagens
- ✅ **Remoção**: Usuários autenticados podem remover imagens

### 5. Testando a Correção

1. Execute o script SQL no Supabase Console
2. Tente atualizar o banner de uma lista
3. Verifique os logs no console do navegador
4. Confirme que a imagem foi atualizada corretamente

### 6. Troubleshooting

Se ainda houver problemas:

1. **Verifique os logs**: Abra o console do navegador e veja os logs detalhados
2. **Verifique as políticas**: Execute a verificação no final do script SQL
3. **Limpe o cache**: Force refresh da página (Ctrl+F5)
4. **Verifique autenticação**: Confirme que o usuário está logado

### 7. Estrutura de Arquivos

```
lists/
├── list-{listId}.webp          # Banner da lista
avatars/
├── avatar-{userId}.webp        # Avatar do usuário
banners/
├── banner-{userId}.webp        # Banner do usuário
```

### 8. Logs de Debug

O sistema agora gera logs detalhados:
- 🔄 Processo de upload
- ✅ Sucessos
- ❌ Erros com detalhes
- 📁 Caminhos dos arquivos
- 🔗 URLs geradas

Isso facilita a identificação e resolução de problemas futuros.










