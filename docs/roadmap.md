# Clakete — roadmap (feito × falta)

Última atualização: 15 Jul 2026  
Migrations do feed (share/details/likes/hides) **já rodadas**. Rodar também `20260713_feed_lists_and_reports.sql` se ainda não aplicou.

Use este doc pra priorizar. Marque `[x]` quando fechar um item.

---

## Como ler

| Status | Significado |
|--------|-------------|
| **Feito** | Em produção / usable no app |
| **Parcial** | Existe base, falta UX ou regra completa |
| **Falta** | Ainda não começou de verdade |

---

## 1. Feed social (home)

### Feito

- [x] Home logada com feed (stories + composer + posts)
- [x] Opt-in: só entra no feed com **Share to feed**
- [x] Fluxo: Log → data/rewatch → share + Friends/Public → Customize
- [x] Customize: masonry (posters + banners), multi-foto (até 6), título, caption
- [x] Layout **Slide** (padrão) vs **All in one** (collage)
- [x] Preview ao vivo no composer
- [x] Seus próprios posts no feed
- [x] Imagens em alta (`w780` / `w1280`), sem título overlay na mídia
- [x] Reviews e listas **não** auto-aparecem (só post compartilhado)
- [x] Preferência `show_following_feed` nas home prefs
- [x] Schema: `feed_shared`, `feed_visibility`, `feed_images`, `feed_title`, `feed_caption`, `feed_layout`, `feed_shared_at`

### Falta / melhorar (feed)

- [x] **Likes no feed** — persistidos em `feed_post_likes`
- [x] **Comentários no feed** — thread inline + `feed_post_comments`
- [x] **Friends vs Public de verdade** — Friends = follow **mútuo**; Public = discover + following; badge no post
- [x] **Editar / apagar** o próprio post — Edit (título/caption/layout/visibility) + Remove from feed
- [x] **Compartilhar review** com opt-in (Share to feed + Friends/Public)
- [x] **Compartilhar lista** no feed (opt-in, não só por ser pública)
- [x] **Stories reais** — viewer fullscreen com posts recentes (72h / fallback)
- [x] Deep link / página do post (`/post/[id]`) pra share externo
- [x] Infinite scroll (IntersectionObserver)
- [x] Hide post (persistido em `feed_post_hides`)
- [x] Report post

Migrations: `20260713_feed_likes_comments.sql` + `20260713_feed_post_hides.sql` + `20260713_feed_lists_and_reports.sql` (+ share/details já anteriores)

---

## 2. Diário / log

### Feito

- [x] `watched_date` + `rewatch_count` no schema
- [x] Dialog de log com calendar (filme/série + composer do feed)
- [x] Rewatch checkbox quando já assistiu
- [x] Datas no diary / activity recente (sem data embaixo do poster no grid Watched — de propósito)
- [x] Editar data / rewatch no Watched (lápis → dialog, sem re-logar)
- [x] Calendar view (mês com posters) + filtros ano/mês
- [x] Export CSV Letterboxd-compatible (`Date,Name,Year,…`)
- [x] Import CSV do Letterboxd (`diary.csv` / watched / ratings → match TMDB)

### Falta / melhorar

- [x] **Share card Instagram / Stories** — usa o componente original `theater-ticket-shadcnui.tsx` (registry @uitripled), parametrizado só nos textos (badge, título, venue=diretor, Data/Nota) com os dados do filme. `ShareCardDialog` (`components/movies/share-card-dialog.tsx`) renderiza o componente real, gera PNG via `html-to-image`, com preview escalado (fit responsivo p/ mobile via `ResizeObserver`), toggle de orientação vertical/horizontal (prop `orientation` no ticket), download, Web Share API (arquivo) e copiar imagem. Botão "Compartilhar" sempre visível nas páginas de filme/série (sem os campos de "assistido"/nota quando não houver)
- [ ] Import Letterboxd **watchlist.csv** → `in_watchlist`
- [ ] Import Letterboxd **reviews.csv** → campo `review` (+ rating se vier)
- [ ] Import Letterboxd **lists/** (pastas) → listas Clakete
- [ ] Import Letterboxd **likes/** (opcional) → `is_liked`
- [ ] Import zip completo de uma vez (hoje: 1 CSV por upload; `profile`/`comments`/`orphaned`/`deleted` fora de escopo)

---

## 3. Monetização / checkout

### Feito

- [x] Stripe checkout (cartão)
- [x] Planos Clakete / Shining picker na aba Subscription
- [x] Badge Shining no perfil

### Falta / melhorar

- [ ] **PIX + BRL** no checkout — hoje USD/cartão; alto impacto pra conversão BR
- [ ] Trial / cupom / annual vs monthly mais claro no UI
- [ ] Portal de billing mais óbvio (cancelar, trocar plano, invoices)
- [ ] Webhook hardening / estados de assinatura edge-case

---

## 4. Perks Shining (o badge sozinho não vende)

### Feito

- [x] Badge + visual shining no perfil
- [x] Badge Shining em posts do feed
- [x] Lista clara de benefícios na pricing (picker + landing)
- [x] Listas privadas limitadas no Free (3) / ilimitadas no Shining
- [x] Temas de perfil (Default, Overlook, Noir, Rose) — Shining only, prefs + CSS
- [x] Early access marcado na UI de temas + bullet no pricing

### Falta (depois)

- [ ] Avatar / banner animado (GIF / WebP)
- [ ] Stats premium no perfil (horas assistidas, genres, streak)

---

## 5. Catálogo / discovery

### Feito

- [x] Film / series pages, search, now showing / upcoming
- [x] Providers / watch info por região
- [x] **Providers BR** — default `watch_region=BR` (antes hardcoded US); fallback BR→US→primeiro país
- [x] Preferência de **região** + **idioma do conteúdo TMDB** em Home preferences (`watch_region`, `tmdb_language`)
- [x] Detail/list/search/discover APIs aceitam `language` / `region` (default `pt-BR` / `BR`)
- [x] Preferência também no **onboarding** (step 1: região + idioma)
- [x] Callers home + films/series (popular/top/upcoming/discover) + genres/season/search passam locale
- [x] Busca com títulos alternativos (fan-out pt-BR / en-US / idioma do user)
- [x] Where to watch: deep link JustWatch por título + chip de região + atribuição JustWatch
- [x] Scaffold i18n de catálogo (`lib/i18n/catalog.ts`) alinhado ao idioma do conteúdo
- [x] **i18n da UI** — `I18nProvider` + dicionários pt-BR / en-US / es-ES / pt-PT (locale = `tmdb_language`); navbar, busca, home, prefs, onboarding step 1, Where to watch, páginas filme/série

### Falta / melhorar

- [ ] Cobertura i18n residual (feed copy, landing marketing, dialogs de log/lista, toasts)
- [ ] Rotas `[locale]` / next-intl (opcional — hoje locale via prefs, sem prefixo de URL)

---

## 6. Social graph / perfil

### Feito

- [x] Follow / unfollow
- [x] Contadores followers / following no perfil
- [x] Feed baseado em following
- [x] Páginas Followers / Following (lista + busca + follow)
- [x] Busca global de users (⌘K → People)
- [x] Activity de verdade no perfil — timeline/log (joined → watches / reviews / likes / lists / follows / shares)
- [x] Liked no Watched — filtro “Liked” (sem tab extra; like também marca watched)
- [x] Like em **reviews** de outras pessoas (`review_likes`)

### Parcial / falta

- _(nenhum item aberto nesta seção)_

---

## 7. Listas

### Feito

- [x] Criar lista, pública/privada, banner, itens, páginas públicas
- [x] Limite de listas privadas no Free (3); Shining ilimitado

### Falta / melhorar

- [ ] Ranking / ordenação colaborativa (se fizer sentido)
- [ ] Colaboradores em lista
- [ ] Lista “featured” / curadoria Clakete
- [ ] Share de lista no feed (ver §1)

---

## 8. Retenção (depois)

- [ ] **Notificações** (follow, like, comment, reply)
- [ ] **Year in review / wrapped** (stats anuais)
- [ ] Comentários em reviews (além do feed)
- [ ] Streaks / “watched this week”
- [ ] Email digest semanal do feed

---

## Prioridade sugerida (próximos sprints)

### Agora (alto impacto, esforço ok)

1. PIX + BRL no checkout  
2. Tab Liked + páginas Followers/Following  
3. Likes persistidos no feed  
4. Friends/Public + (opcional) discover de posts públicos  

### Em seguida

5. ~~Activity real no perfil~~ ✅ timeline/log  
6. Providers BR  
7. Comentários no feed  
8. Editar/apagar post + unshare  

### Shining / retenção

9. Perks concretos do Shining (GIF, stats, listas privadas)  
10. Notificações  
11. Year in review  

---

## Checklist rápido “feed MVP fechado”

Quando isto estiver `[x]`, o feed social pode ser considerado MVP completo:

- [x] Opt-in share + customize  
- [x] Só posts compartilhados  
- [x] Multi-foto + caption + layout  
- [x] Migrations aplicadas  
- [x] Like persistido  
- [x] Comentário básico  
- [x] Apagar/unshare o próprio post  
- [x] Editar post (título/caption/layout/visibility)  
- [x] Visibilidade Friends/Public com discover  
- [x] Infinite scroll  
- [x] Deep link `/post/[id]`  
- [x] Hide post  
- [x] Stories viewer  
- [ ] Migration likes/comments + hides — rodar se ainda não rodou  
- [ ] Share review / lista no feed  
- [ ] Report post  

---

## Notas

- Log na página do filme **sem** share continua só no diário — correto.  
- Composer da home é o caminho pra postar no feed.  
- Detalhe de produto do feed: `docs/feed-social-home.md`.
- **App iOS (plano):** `docs/ios-todo.md` — checklist SwiftUI; clone Plotwist em `d:\clakete\_refs\plotwist`.
- **App mobile testável agora:** Expo mock em `apps/expo-app/` (Windows: `npm run web` / Expo Go). Swift nativo fica em `apps/ios/` como referência.
