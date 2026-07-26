## Status

**Feed live** — `components/home/social-feed.tsx` + `hooks/use-following-feed.ts`.  
Stories (following), composer com fluxo **Log → Share? → Customize foto**, posts reais.

**Opt-in:** o feed só mostra itens com `feed_shared = true` (watch customize, review share, ou list share).  
Reviews e listas **não** entram só por existirem — precisam do toggle Share to feed.  
Migrations: `20260713_feed_share_fields.sql` + `20260713_feed_post_details.sql` + `20260713_feed_likes_comments.sql` + `20260713_feed_post_hides.sql` + `20260713_feed_lists_and_reports.sql` (rodar no SQL editor).  
Likes/comentários em posts de interaction; hide/report; unshare no menu do autor.

---

# Feed social na home — ideia estilo X / Instagram

Documento de produto + UX para a home logada do Clakete.  
Objetivo: transformar a home de “catálogo + blocos soltos” em um **feed de atividade cinematográfica** — no espírito do X (timeline) e do Instagram (stories + posts), mas feito pra filme/série.

---

## 1. Por que isso

Hoje a home mistura:

- atalhos
- activity de following (lista densa)
- now showing / upcoming
- suas reviews

Funciona, mas não tem **um eixo claro**. Em apps sociais o eixo é o feed: você abre e imediatamente vê o que o seu círculo fez.

No Clakete, o “círculo” são pessoas que você segue. O “conteúdo” é log, review, lista, like — não foto aleatória.

**Promessa:** abrir a home = ver o que a galera que você curte assistiu, escreveu e listou — rápido, bonito, viciante.

---

## 2. Referências (o que pegar / o que não pegar)

### Do X (Twitter)

| Pegar | Não pegar |
|--------|-----------|
| Timeline vertical contínua | Thread infinito de texto |
| Avatar + nome + ação + timestamp numa linha | Quote-tweet / quote de quote |
| Composer no topo (“o que você está pensando?”) | Trending topics genéricos |
| Infinite scroll com “load more” suave | Ads no meio do feed |

### Do Instagram

| Pegar | Não pegar |
|--------|-----------|
| Stories / anéis no topo (atividade recente das pessoas) | Grid de posts quadrados forçado |
| Post com mídia dominante (poster / still) | Stories que somem em 24h (opcional depois) |
| Like / comentário / salvar como micro-ações | Reels / vídeo short primeiro |

### Do Letterboxd (âncora do produto)

| Pegar | Manter Clakete |
|--------|----------------|
| “X watched Y” / “X reviewed Y” | Visual vermelho Clakete, não verde Letterboxd |
| Poster como unidade visual | Feed na **home**, não só no perfil |
| Diary com data | Rewatch / rating embutidos |

**Síntese Clakete:** timeline do X + densidade visual do IG + semântica Letterboxd.

---

## 3. Conceito de tela

```
┌─────────────────────────────────────────────────────────┐
│  [Hero backdrop curto — opcional]                       │
│  Hey, @user                         [chips: Films…]     │
├─────────────────────────────────────────────────────────┤
│  STORIES STRIP (anéis)                                  │
│  (você)  @ana  @joao  @bia  @leo  …                     │
├──────────────────────────────┬──────────────────────────┤
│  FEED (main)                 │  RAIL (opcional desktop) │
│                              │  Now showing (mini)      │
│  [Composer: Log a film…]     │  Upcoming (mini)         │
│                              │                          │
│  ┌─ Post ─────────────────┐  │                          │
│  │ avatar  @ana · 2h      │  │                          │
│  │ watched Parasite       │  │                          │
│  │ ★★★★☆                  │  │                          │
│  │ [ poster grande ]      │  │                          │
│  │ “insano do começo…”    │  │                          │
│  │ ♡ 12   💬 3   ↗        │  │                          │
│  └────────────────────────┘  │                          │
│                              │                          │
│  ┌─ Post ─────────────────┐  │                          │
│  │ …                      │  │                          │
│  └────────────────────────┘  │                          │
└──────────────────────────────┴──────────────────────────┘
```

Mobile: rail some; feed full-width. Stories strip fica sticky opcional.

---

## 4. Tipos de post (cards)

Cada item do feed é um **post** com estrutura comum:

1. **Header** — avatar, nome, @username, verbo de ação, tempo relativo (`2h`, `ontem`)
2. **Body** — título do filme/série (link) + rating opcional + texto curto
3. **Media** — poster (ou still/backdrop se for review rica)
4. **Footer** — ações: like no post, comentar (fase 2), abrir título, abrir perfil

### 4.1 Watched

> **@ana** watched **Parasite** · 2h  
> ★★★★☆  
> [poster]  
> *(sem texto, ou nota opcional depois)*

### 4.2 Rewatch

> **@ana** rewatched **Parasite** · 1d  
> badge “rewatch” discreto

### 4.3 Review

> **@joao** reviewed **The Substance** · 5h  
> ★★★★★  
> [poster ou still widescreen]  
> texto (2–4 linhas + “more”)

### 4.4 List created / updated

> **@bia** made a list **Neon Noirs** · 1d  
> [stack de 3–5 posters]  
> “12 titles”

### 4.5 Liked a film (fase 2)

> **@leo** liked **Challengers**

### 4.6 Followed someone (fase 2, raro)

Só se fizer sentido social — baixo prioridade.

---

## 5. Stories strip (topo)

Inspirado no IG, mas sem expirar em 24h no MVP.

**O que é:** anéis das pessoas que você segue com atividade recente (últimas 48–72h).

- Toque no anel → sheet / modal com os posts só daquela pessoa (mini-timeline)
- Anel “você” à esquerda → atalho pra **Log watch** (abre search + log dialog)
- Anel ativo = borda vermelha `#FF0048`; visto = borda muted

Isso resolve o “feed gigante”: o topo vira **navegação social**, o feed fica só o que importa.

---

## 6. Composer (topo do feed)

Estilo X, sem parecer Twitter genérico.

Placeholder: `Log something you watched…`

Ao clicar:

1. Search filme/série (command já existe)
2. Log dialog (data + rewatch) — já existe
3. Opcional: rating + review curta no mesmo fluxo (fase 1.5)

Composer **não** é status text livre. No Clakete, post = sempre ancorado num título TMDB.

---

## 7. Hierarquia visual (anti-gigante)

Regras duras:

| Elemento | Regra |
|----------|--------|
| Post height | Watched ~120–160px; Review max ~280px antes de “more” |
| Poster | Watched: ~64–80px; Review: até 40% da largura do card, não full-bleed hero |
| Tipografia | Header 13–14px; título 15–16px medium; body 13–14px muted |
| Espaçamento | `py-3` / `py-4` entre posts — sem `py-8` de seção |
| Limite inicial | 12–15 posts + “Load more” / infinite scroll |
| Seções laterais | Rail estreito (≤300px), sem headers enormes |
| Hero home | Curto ou opcional; feed começa cedo no viewport |

**Princípio:** o feed é o herói. Catálogo (now showing) é rail, não competidor.

---

## 8. Interações no post

### MVP

- Click no poster / título → página do filme/série
- Click no avatar / nome → perfil
- Like no **filme** (já existe) a partir do post (atalho)

### Fase 2

- Like no **post** (atividade) — tabela `feed_likes` ou reuse
- Comentário curto no post
- Share / copy link do post (`/activity/{id}` ou deep link)

### Fase 3

- Notificações (“@x liked your review”)
- Reply thread estilo X (leve)

---

## 9. Dados e arquitetura (MVP sem tabela nova)

Continua vindo de:

1. `user_followers` → quem eu sigo  
2. `items_interactions` → watched / review / rating  
3. `lists` (+ `list_items`) → listas públicas  

Merge client-side por timestamp (já rascunhado em `use-following-feed`).

### Evolução recomendada (quando doer)

Tabela `activity_events`:

| coluna | tipo |
|--------|------|
| `id` | uuid |
| `actor_id` | uuid → users |
| `kind` | `watched` \| `rewatch` \| `review` \| `list_create` \| `like` |
| `tmdb_id` / `media_type` / `list_id` | refs |
| `payload` | jsonb (rating, excerpt, rewatch_count) |
| `created_at` | timestamptz |

Escrita via trigger ou no mesmo upsert das interações.  
Leitura: `where actor_id in (following) order by created_at desc`.

Isso evita ambiguidade do one-row-per-title em `items_interactions`.

---

## 10. Preferências da home

Manter toggle `show_following_feed`.

Novos (opcional):

- `feed_density`: `comfortable` \| `compact`
- `feed_show_watched`: bool (só reviews se quiser menos ruído)
- `feed_show_catalog_rail`: bool (esconde now showing)

Default: feed on, density compact, watched + reviews + lists on, rail on (desktop).

---

## 11. Empty states

1. **Não segue ninguém**  
   CTA: “Follow people to build your feed” + link pra listas públicas / sugeridos (fase 2: “Suggested film people”)

2. **Segue, mas quieto**  
   “Nothing new — log a film yourself” + composer destacado

3. **Erro / RLS**  
   Mensagem curta + retry

---

## 12. Roadmap sugerido

### Fase 0 — agora (polish do que existe)
- [x] Feed básico following
- [ ] Cards densos estilo timeline (avatar + linha + poster pequeno)
- [ ] Limite 10–12 + load more
- [ ] Home 2 colunas (feed + rail)

### Fase 1 — “Feed de verdade”
- [ ] Stories strip de following recente
- [ ] Composer → log flow
- [ ] Cards tipados (watched / review / list) com hierarquia visual clara
- [ ] Tempo relativo (`2h`, `yesterday`)
- [ ] Infinite scroll

### Fase 2 — social loop
- [ ] Likes/comentários em posts
- [ ] Notificações
- [ ] Página `/following` só feed (full screen)
- [ ] Suggested people

### Fase 3 — retenção
- [ ] `activity_events` table
- [ ] Year in review / “this week in your circle”
- [ ] Stories com expiração opcional (modo IG puro)

---

## 13. Métricas de sucesso

- % de sessões logadas que scrollam o feed (>3 posts)
- CTR poster → página do filme
- Novos follows a partir do feed / stories
- Logs criados via composer da home
- Tempo até primeiro like/comentário (fase 2)

---

## 14. Riscos

| Risco | Mitigação |
|-------|-----------|
| Feed vazio (ninguém segue) | Empty state forte + suggested + composer |
| Ruído demais (só watched) | Preferência “reviews only”; rankear review > list > watched |
| RLS bloqueia leitura cross-user | Policies explícitas em `items_interactions` / `lists` |
| Parecer “clone do IG” | Sem stories efêmeros no MVP; identidade Clakete (vermelho, posters, diary) |
| Performance `.in(following)` | Limitar following fetch; depois RPC/`activity_events` |

---

## 15. Decisão pedida

Marque o que você quer como próxima implementação:

1. **Só polish** — cards densos + load more (sem stories/composer)  
2. **Fase 1 completa** — stories strip + composer + cards tipados  
3. **Full feed page** — `/following` full-bleed tipo X, home só espelha preview  

Quando escolher, implementamos em cima deste doc.
