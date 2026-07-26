# Clakete iOS — TODO

Checklist para um app **iOS nativo (SwiftUI)**, espelhando o que [plotwist-app/plotwist](https://github.com/plotwist-app/plotwist) faz em `apps/ios/`, mas alinhado ao produto Clakete (Supabase, feed social, diário, Shining).

**Referência local (clone fora deste repo):** `d:\clakete\_refs\plotwist`  
**Docs dele:** `IOS_TASKS.md`, `CLAUDE.md` (seção iOS), `REACT_NATIVE_TASKS.md` (mapa de features web→mobile)

Marque `[x]` quando fechar. Prioridade sugerida = sprints no final.

---

## Sprint 0 — Front mock (feito)

- [x] Scaffold `apps/ios/Clakete` SwiftUI (Theme, RootView, tabs, mock data) — precisa Mac
- [x] **Expo mock testável no Windows:** `apps/expo-app/` (web / Expo Go)
- [x] Onboarding / Login / Guest / Home / Discover / Lists / Profile / Search / detalhe / Paywall
- [x] README com como testar

Ver: [`apps/expo-app/README.md`](../apps/expo-app/README.md)

---

## Como o Plotwist estruturou o iOS (o que copiar)

| Decisão | Plotwist | Clakete iOS |
|--------|----------|-------------|
| Stack | SwiftUI nativo (não RN) | **Igual** — SwiftUI |
| Arquitetura | Service-oriented, **sem ViewModels** | **Igual** |
| Estado | `@State` na View → `Service.shared` → async/await | **Igual** |
| Nav root | `RootView`: onboarding → home (tabs) **ou** login; guest mode | **Igual** |
| Tabs | Home · Discover · Profile · Search (role `.search`) | Home (feed) · Films/Series · Lists · Profile · Search |
| TMDB | Proxy no backend (`/tmdb/...`) com cache Redis | Proxy nas **API routes Next** já existentes (`/api/movies`, `/api/series`, …) **ou** edge function Supabase depois |
| Auth | JWT próprio + Keychain/UserDefaults | **Supabase Auth** (Swift SDK) + Keychain |
| i18n | `L10n.current` + Notification `.languageChanged` | Espelhar dicionários web (`lib/i18n/messages`) → `Localization/Strings.swift` |
| Premium | Paywall + StoreKit/`SubscriptionService` | **The Shining** via StoreKit 2 + sync Stripe/webhook quando possível |
| Pastas | `App/`, `Views/`, `Services/`, `Components/`, `Theme/`, `Localization/`, `Utils/` | **Mesma árvore** |

### Regras que eles usam (seguir no Clakete)

- Não criar ViewModels separados — estado na View.
- Sempre `NavigationStack` (nunca `NavigationView`).
- Imagens: `CachedAsyncImage` (não `AsyncImage`).
- Cores só via tokens (`Theme/Colors.swift`).
- Corner radius só via `DesignTokens.CornerRadius.*`.
- Cache: restaurar em `.onAppear`, refresh em `.task { }`.
- Cross-tab: `NotificationCenter` (ex.: `.navigateToSearch`, `.authChanged`, `.languageChanged`).

Data flow:

```
View (@State) → Service.shared → API (async/await) → Response → View
```

### Árvore alvo (espelho Plotwist)

```
apps/ios/Clakete/          # ou monorepo separado clakete-ios/
└── Clakete/
    ├── ClaketeApp.swift
    ├── App/
    │   └── RootView.swift
    ├── Services/          # singletons
    ├── Views/
    │   ├── Auth/
    │   ├── Onboarding/
    │   ├── Home/          # feed + tabs shell
    │   ├── Catalog/       # films / series
    │   ├── Details/
    │   ├── Lists/
    │   ├── Profile/
    │   ├── Diary/
    │   ├── Paywall/
    │   └── Reviews/
    ├── Components/
    ├── Theme/
    ├── Localization/
    ├── Extensions/
    ├── Utils/
    └── Assets.xcassets
```

---

## Diferenças Clakete × Plotwist (não portar cego)

| Plotwist | Clakete |
|----------|---------|
| Feed = “atividades” (status change, etc.) | **Feed social opt-in** (posts, stories, likes, comments, Friends/Public) — núcleo do produto |
| Coleção com status Watching/Dropped | Diário: **watched_date + rewatch**, watchlist, liked |
| Backend Fastify + Drizzle | **Supabase** (Postgres + Auth + Storage) + Next API |
| PRO genérico | **The Shining** (listas privadas ilimitadas, temas, badge) |
| Animes/Doramas como vertical | Cinema + séries (sem foco anime por ora) |
| 7 idiomas | Começar com **pt-BR / en-US / es-ES / pt-PT** (igual web) |

---

## 1. Setup inicial

### 1.1 Projeto
- [ ] Criar Xcode project SwiftUI (`Clakete`), iOS 17+ (Tabs com `role: .search` como Plotwist)
- [ ] SwiftLint + SwiftFormat
- [ ] Schemes Debug / Release + `xcconfig` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `API_BASE_URL`)
- [ ] Colocar o app em `apps/ios/` no monorepo **ou** repo `clakete-ios` — decidir cedo
- [ ] `.gitignore` de signing / `Secrets.xcconfig`

### 1.2 Dependências (SPM)
- [ ] [supabase-swift](https://github.com/supabase/supabase-swift) — Auth, DB, Storage
- [ ] Kingfisher **ou** componente `CachedAsyncImage` próprio (estilo Plotwist)
- [ ] KeychainAccess (session)
- [ ] (Opcional) Lottie — celebração onboarding
- [ ] StoreKit 2 — Shining (nativo)

### 1.3 Theme + tokens
- [ ] `Theme/Colors.swift` — fundo `#09090B`, accent `#FF0048`, muted, border
- [ ] `DesignTokens` — poster 16, thumbnail 8, input 12, badge 6; button height 48–52; padding H 24
- [ ] `ThemeManager` (dark default; themes Overlook/Noir/Rose = Shining only)

### 1.4 Networking
- [ ] `API.baseURL` apontando pro deploy Next (`https://…`)
- [ ] `TMDBService` chamando `/api/movies`, `/api/series`, search, discover (+ `language`/`region` das prefs)
- [ ] `SupabaseClient.shared` para auth + tabelas (`users`, interactions, feed, lists)
- [ ] Erros tipados (`APIError`, `AuthError`)

---

## 2. Auth + Root

- [ ] `AuthService.shared` — signIn / signUp / signOut / session restore (Supabase)
- [ ] Persistência Keychain; notificar `.authChanged`
- [ ] `RootView`: onboarding (não completo + guest/unauth) → `HomeView` (auth **ou** guest) → `LoginView`
- [ ] Guest mode (browse catálogo; gate em log/review/feed post)
- [ ] Telas: `LoginView`, `SignUpView`, Forgot password (Supabase reset)
- [ ] Deep link `clakete://` + Universal Links (`/film/[id]`, `/series/[id]`, `/post/[id]`, `/@user`)

---

## 3. Navegação (tabs)

Seguir o shell do Plotwist (`HomeView` + `TabView`):

- [ ] Tab **Home** — feed following (+ rail Now showing / Upcoming se prefs)
- [ ] Tab **Discover** — filmes/séries popular · top · upcoming · discover
- [ ] Tab **Lists** — suas + públicas (Plotwist não tem tab Lists; Clakete precisa)
- [ ] Tab **Profile** — próprio perfil / Watched / Watchlist / Activity
- [ ] Tab **Search** (`role: .search`) — filme · série · people
- [ ] Stacks por tab com `NavigationStack`
- [ ] Cross-tab via `NotificationCenter` (buscar, abrir filme, etc.)

---

## 4. Onboarding

Espelhar web + Plotwist (`Views/Onboarding/`):

- [ ] Welcome / splash
- [ ] Display name + **região** + **idioma** (igual step 1 web)
- [ ] Gêneros favoritos
- [ ] Salvar em `users.home_preferences` + profile
- [ ] `OnboardingService` (local → sync pós-login)
- [ ] Prompt login / notificações (opcional, como Plotwist)

---

## 5. Home / Feed social (diferencial Clakete)

- [ ] `FeedService` — list following / public, pagination, hides
- [ ] `SocialFeedView` — cards (watch / review / list), badges Friends/Public
- [ ] Stories viewer (posts 72h)
- [ ] Likes + comentários thread
- [ ] Composer: share from log (layout Slide / All-in-one, caption, images)
- [ ] Edit / remove own post; report / hide
- [ ] Prefs: `show_following_feed`, backdrop, now showing, upcoming
- [ ] Cache `HomeDataCache` (padrão Plotwist)

---

## 6. Catálogo

### Filmes
- [ ] Popular / Now showing / Upcoming / Top rated / Discover (filtros gênero · ano · providers · região)
- [ ] `PosterCard` + grid + infinite scroll + pull-to-refresh

### Séries
- [ ] Popular / On the air / Top / Discover
- [ ] Temporadas + episódios (páginas já existem no web)

### Detalhe (filme / série)
- [ ] Backdrop + poster + trailer (sheet AVPlayer / YouTube)
- [ ] Sinopse, genres, directed/created by
- [ ] Ações: log watch · like · watchlist · rating · review
- [ ] Abas: créditos · similar · recommended · images · seasons (TV)
- [ ] **Where to watch** — região user + deep links JustWatch (mesmo fluxo web `/api/watch-links`)
- [ ] Recent reviews list

---

## 7. Diário / interações

- [ ] `UserItemService` (ou `FilmInteractionsService`) — watched / like / watchlist / rating / review
- [ ] `LogWatchSheet` — data + rewatch (paridade web)
- [ ] Watched grid + calendar month
- [ ] Export CSV Letterboxd-compatible
- [ ] Import Letterboxd CSV (document picker) — fase 2

---

## 8. Reviews

- [ ] `ReviewService` — CRUD + likes em reviews de outros
- [ ] `ReviewItemView`, form sheet, share to feed (opt-in)
- [ ] (Fase 2) Share card Stories / Instagram (ticket UI do web)

---

## 9. Listas

- [ ] `ListService` — create / edit / items / public-private
- [ ] Limite **3 listas privadas** free; ilimitado Shining
- [ ] Fluxo new list (steps) inspirado em `/list/new`
- [ ] Share lista no feed (opt-in)
- [ ] Detalhe com banner + grid + reordenar

---

## 10. Perfil + social graph

- [ ] Header avatar/banner, username, bio, badge Shining
- [ ] Contadores followers / following + listas
- [ ] Abas: Activity · Watched · Watchlist · Lists · Reviews
- [ ] `FollowService` — follow/unfollow
- [ ] Edit profile (avatar TMDB crop como Plotwist `AvatarPickerView`)
- [ ] Themes Shining (gating)

---

## 11. Busca

- [ ] Debounce multi-search (films / series / people)
- [ ] Fan-out AKA se a API web já faz — reutilizar endpoint
- [ ] Histórico local de buscas

---

## 12. Preferências + i18n

- [ ] Região streaming + idioma conteúdo/UI
- [ ] Home sections toggles
- [ ] `L10n` / `Strings.swift` — pt-BR, en-US, es-ES, pt-PT
- [ ] `.onReceive(.languageChanged)` nas telas com copy
- [ ] Sync com `users.home_preferences` (mesmo schema web)

---

## 13. The Shining (premium)

- [ ] `SubscriptionService` + StoreKit 2 (produto annual/monthly)
- [ ] `PaywallView` (benefícios: listas privadas ∞, temas, badge, early access)
- [ ] Badge no perfil e posts do feed
- [ ] Gate UI (`ProGateOverlay` estilo Plotwist)
- [ ] Validar receipt / sync com backend (Stripe customer se já existe)

---

## 14. Push (fase 2)

- [ ] APNs + preferências
- [ ] Follow, like, comment, reply

---

## 15. Componentes reutilizáveis (MVP)

- [ ] `PrimaryButton`, `StarRatingView`, `PosterCard`, `SegmentedTabBar`
- [ ] `FollowButton`, `StatusSheet` / log sheet, `CachedAsyncImage`
- [ ] Skeletons / shimmer
- [ ] `ShiningBadge`

---

## 16. UX nativa / polish

- [ ] Pull to refresh; haptics em like/log
- [ ] Splash + App Icon
- [ ] FlashList / LazyVGrid virtualizado
- [ ] Offline cache leve (detalhes recentes)
- [ ] Accessibility (Dynamic Type básico)

---

## Estimativa de complexidade

| Módulo | Complexidade | Prioridade |
|--------|--------------|------------|
| Setup + Theme | Baixa | Alta |
| Auth + Root + Guest | Média | Alta |
| Tabs + Search + Catalog list | Média | Alta |
| Detalhe + Where to watch | Alta | Alta |
| Log / Watched / Rating | Média | Alta |
| Feed social completo | Alta | Alta |
| Listas | Alta | Média |
| Perfil + Follow | Média | Alta |
| Onboarding + prefs + i18n | Média | Média |
| Shining / StoreKit | Média | Média |
| Import Letterboxd / Push / Share card | Alta | Baixa |

---

## Sprints sugeridos

### Sprint 1 — Foundation (2–3 sem)
Setup Xcode · Theme · Auth Supabase · RootView · Tabs vazias · TMDBService via API Next · Search multi · Lista popular + detalhe filme (read-only)

### Sprint 2 — Core diary (2–3 sem)
Log watch · rating · watchlist · like · perfil próprio Watched/Watchlist · Where to watch · i18n base · onboarding região/idioma

### Sprint 3 — Social (2–3 sem)
Follow · Feed read · likes/comments · stories viewer · deep link post · share from log

### Sprint 4 — Listas + Shining (2 sem)
CRUD listas · limite free · paywall StoreKit · temas · badge

### Sprint 5 — Polish (1–2 sem)
Import CSV · calendar · push · share card · performance · TestFlight

---

## Referências rápidas (Plotwist clone)

| Path | Por quê |
|------|---------|
| `apps/ios/Plotwist/Plotwist/App/RootView.swift` | Gate onboarding / auth / guest |
| `apps/ios/Plotwist/Plotwist/Views/Home/HomeView.swift` | TabView shell |
| `apps/ios/Plotwist/Plotwist/Services/*.swift` | Padrão singleton + cache |
| `apps/ios/Plotwist/Plotwist/Services/TMDBService.swift` | Proxy TMDB (adaptar p/ `/api/*` Clakete) |
| `apps/ios/Plotwist/Plotwist/Views/Onboarding/` | Fluxo multi-step |
| `apps/ios/Plotwist/Plotwist/Views/Paywall/` | Monetização mobile |
| `CLAUDE.md` (seção iOS) | Regras de código / tokens |
| `IOS_TASKS.md` | Checklist monolítico de features |

## Referências Clakete (web)

| Path | Por quê |
|------|---------|
| `docs/roadmap.md` | O que já existe no produto |
| `docs/feed-social-home.md` | Regras do feed |
| `lib/i18n/messages/` | Strings a portar |
| `lib/user-home-preferences.ts` | Schema prefs |
| `app/api/**` | Contratos HTTP TMDB + watch-links |
| `hooks/use-film-interactions.ts` | Modelo de interação |

---

*Gerado a partir do clone de [plotwist-app/plotwist](https://github.com/plotwist-app/plotwist) em 15 Jul 2026. Atualize este arquivo conforme o app iOS avançar.*
