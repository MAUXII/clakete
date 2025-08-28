# Configuração do Supabase

## Tabelas e Funções Necessárias

Este projeto requer várias tabelas e funções no Supabase. Abaixo estão as instruções para criar cada uma delas.

### Tabelas Principais

1. **users** - Criada automaticamente pelo Supabase Auth
2. **film_interactions** - Armazena interações do usuário com filmes (visualizações, curtidas, avaliações)
3. **users_favorite_films** - Armazena filmes favoritos dos usuários
4. **user_followers** - Armazena relações de seguidores entre usuários

### Como Configurar

1. Acesse o Painel de Controle do Supabase para seu projeto
2. Vá para o SQL Editor
3. Execute os scripts na pasta `migrations` na seguinte ordem:

## 1. Criar Tabela de Interações com Filmes

A tabela `film_interactions` armazena todas as interações do usuário com filmes, como:
- Filmes assistidos (is_watched)
- Filmes curtidos (is_liked)
- Avaliações (rating)
- Reviews (review)
- Lista de filmes a assistir (in_watchlist)

Execute o script `create_film_interactions_table.sql`.

## 2. Criar Tabela de Filmes Favoritos

A tabela `users_favorite_films` armazena os filmes favoritos de cada usuário com suas posições.
- Cada usuário pode ter até 4 filmes favoritos
- Os filmes são ordenados por posição
- Cada posição só pode ter um filme por usuário

Execute o script `create_users_favorite_films_table.sql`.

## 3. Criar Tabela de Seguidores

A tabela `user_followers` armazena as relações de seguidores entre usuários.

Execute o script `create_user_followers_table.sql`.

## 4. Criar Funções RPC

Adicione as funções RPC para permitir que a aplicação crie tabelas quando necessário:

Execute o script `create_followers_rpc.sql`.

## Verificação

Após executar todos os scripts, verifique se todas as tabelas e funções foram criadas corretamente:

1. Vá para a seção "Database" no painel do Supabase
2. Verifique se as tabelas `film_interactions`, `users_favorite_films` e `user_followers` estão presentes
3. Vá para a seção "Functions" e verifique se as funções RPC estão presentes

## Políticas de Segurança (RLS)

Todas as tabelas têm Row Level Security (RLS) habilitada com as seguintes políticas:

### film_interactions
- Usuários podem ver suas próprias interações
- Usuários podem inserir/atualizar apenas suas próprias interações

### users_favorite_films
- Qualquer pessoa pode ver filmes favoritos de usuários
- Usuários podem inserir/atualizar/excluir apenas seus próprios filmes favoritos
- Cada usuário pode ter no máximo 4 filmes favoritos (controlado pela aplicação)

### user_followers
- Qualquer pessoa pode ver relações de seguidores
- Usuários autenticados podem seguir outros usuários
- Usuários podem deixar de seguir apenas si mesmos

## Troubleshooting

Se encontrar problemas ao executar os scripts:

1. Verifique se não há erros de sintaxe
2. Verifique se as tabelas dependentes já existem antes de criar referências
3. Se uma tabela já existir, você pode excluí-la e recriá-la (cuidado com dados existentes)

```sql
DROP TABLE IF EXISTS public.user_followers CASCADE;
DROP TABLE IF EXISTS public.users_favorite_films CASCADE;
DROP TABLE IF EXISTS public.film_interactions CASCADE;
``` 