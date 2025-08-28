# Plano de Desenvolvimento - WebApp de Filmes (Letterboxd-like)

## 1. Configuração Inicial
- [x] Projeto Next.js já configurado
- [x] Configurar Supabase
  - Criar novo projeto
  - Configurar variáveis de ambiente
  - Instalar SDK do Supabase

## 2. Autenticação
### 2.1 Configuração do Supabase Auth
- [x] Habilitar provedores de autenticação:
  - Email/Senha
  - Google
- [ ] Configurar URLs de redirecionamento

### 2.2 Páginas de Autenticação
- [ ] Criar página de login (/sign-in)
  - Form de email/senha
  - Botão de login social (Google)
  - Link para cadastro
- [ ] Criar página de cadastro (/sign-up)
  - Form com:
    - Username, Foto de perfil, Bio - só vai aparecer depois de clicar no botão de login social ou depois de criar uma conta com email/senha, ai assim ele vai aparecer para ser preenchido
    - Email
    - Senha
  - Botões de cadastro social

Após o login, ele vai ser redirecionado para a página de home, ai ele vai poder ver os filmes que ele assistiu através do (nome do profile)/filmes e os que ele quer assistir através do (nome do profile)/watchlist. basicamente nome do profile é o nome do usuário que ele criou no sign-up e cada um meio que terá sua própria página de perfil. então se eu quiser acessar o perfil de outro usuário, eu posso acessar através da barra de navegação.

Agora após o cadastro, ele vai ser redirecionado para a página de profile dele, ".../(nome do profile)" para poder customizar o seu profile.

## 3. Banco de Dados
### 3.1 Estrutura das Tabelas
- [ ] users
  ```sql
  id: uuid
  username: text
  email: text
  avatar_url: text
  created_at: timestamp
  ```
- [ ] profiles
  ```sql
  id: uuid
  user_id: uuid (ref: users.id)
  bio: text
  location: text
  website: text
  ```
- [ ] movies
  ```sql
  id: uuid
  tmdb_id: integer
  title: text
  poster_path: text
  release_date: date
  ```
- [ ] reviews
  ```sql
  id: uuid
  user_id: uuid (ref: users.id)
  movie_id: uuid (ref: movies.id)
  rating: integer
  content: text
  created_at: timestamp
  ```
- [ ] watchlist
  ```sql
  id: uuid
  user_id: uuid (ref: users.id)
  movie_id: uuid (ref: movies.id)
  added_at: timestamp
  ```

## 4. Funcionalidades Principais
### 4.1 Perfil do Usuário
- [ ] Página de perfil
- [ ] Edição de perfil
- [ ] Visualização de reviews
- [ ] Lista de filmes assistidos
- [ ] Watchlist

### 4.2 Filmes
- [ ] Integração com TMDB API
- [ ] Página de detalhes do filme
- [ ] Sistema de busca
- [ ] Filtros por:
  - Gênero
  - Ano
  - Popularidade
  - Avaliação

### 4.3 Reviews e Ratings
- [ ] Sistema de avaliação (★★★★★)
- [ ] Sistema de reviews
- [ ] Likes em reviews
- [ ] Comentários em reviews

## 5. UI/UX
- [ ] Design System
  - Componentes reutilizáveis
  - Tema escuro/claro
  - Responsividade
- [ ] Layout
  - Header com navegação
  - Footer
  - Sidebar (opcional)

## 6. Otimizações
- [ ] SEO
- [ ] Performance
- [ ] Caching
- [ ] Loading states
- [ ] Error handling

## 7. Deploy
- [ ] Configurar deploy (Vercel)
- [ ] Configurar domínio
- [ ] Monitoramento
- [ ] Analytics

## Tecnologias Principais
- Next.js
- Supabase (Auth + Database)
- TypeScript
- Tailwind CSS
- TMDB API
- shadcn/ui (componentes)

## Prioridades de Desenvolvimento
1. Configuração inicial e autenticação
2. Estrutura do banco de dados
3. Funcionalidades core (perfil, filmes, reviews)
4. UI/UX
5. Otimizações
6. Deploy
