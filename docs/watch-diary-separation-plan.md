# Plano: Assistidos vs Diário (estilo Letterboxd)

Status: **aguardando approval**

## Visão em uma frase

**Olhinho** = “já vi” (rápido, sem data). **Registrar no diário** = “vi neste dia” (data + opcional nota, review, curtida) → só isso entra no Diário e ganha URL `/{user}/film/{slug}`.

---

## 1. Comportamento por superfície

### 1.1 Cards (poster no catálogo, listas, perfil)

| Ação | Comportamento |
|------|----------------|
| 👁️ **Olho** | Toggle instantâneo `is_watched`. **Não** abre dialog. **Não** cria `watch_logs`. Toast curto (“Marcado como assistido” / “Removido”). |
| ❤️ **Coração** | Toggle `is_liked` (como hoje). |
| **⋯ Menu** (novo) | Dropdown estilo Letterboxd com: **Registrar no diário…**, Adicionar à watchlist, Adicionar à lista… (fase 2 se faltar), link “Onde assistir” → página do filme. |
| **Registrar no diário…** | Abre o **LogWatchDialog** redesenhado. |

**Regra:** clicar no poster continua indo para `/film/...` ou URL de log só no contexto do **Diário** do perfil.

### 1.2 Página do filme / série

| Controle | Comportamento |
|----------|----------------|
| 👁️ (FilmActions) | Toggle rápido assistido (sem dialog). |
| **Registrar no diário** (botão ou +) | Abre LogWatchDialog. |
| ⭐ / Review na página | Continuam na página; ao salvar review com data opcional, pode sincronizar com último log ou criar log — **fase 1:** manter na página do filme; log explícito só via dialog. |

### 1.3 Perfil — abas

| Aba | Rota | Conteúdo |
|-----|------|----------|
| Profile | `/{user}` | Bio, stats, reviews recentes (como hoje). |
| **Assistidos** | `/{user}/watched` | **Grid de posters**, 1 card por título (`is_watched`). Sem calendário. Clique → `/film/...` ou `/series/...`. |
| **Diário** | `/{user}/diary` (nova) | Calendário + lista por data (migrar `WatchedDiary` atual). Clique → `/{user}/film/{slug}` ou `.../1`. |
| Lists | `/{user}/lists` | Sem mudança. |
| Reviews | `/{user}/reviews` | Sem mudança. |
| ~~Activity~~ | ~~`/{user}/activity`~~ | **Removida** → redirect para `/diary`. Conteúdo social fica na Home/feed. |
| Watchlist | `/{user}/watchlist` | Sem mudança. |

**Labels PT (UI):** Assistidos · Diário (ou “Diary” se preferir inglês na nav).

---

## 2. LogWatchDialog — design

### Layout desktop (≥ `sm`)

```
┌─────────────────────────────────────────────────┐
│  [X]  Registrar no diário                       │
├──────────────┬──────────────────────────────────┤
│              │  Título do filme (ano)             │
│   POSTER     │  ─────────────────────────────     │
│   2:3        │  📅 Data (calendar popover)        │
│   rounded-2xl│  ☐ É reassistida (se já assistiu)  │
│              │  ⭐ Nota (opcional)                │
│              │  📝 Review (textarea, opcional)    │
│              │  ❤️ Curtir este título (toggle)    │
│              │                                    │
│              │  [Remover do diário]  Cancel  Save │
└──────────────┴──────────────────────────────────┘
```

- **Poster à esquerda** (~140–180px), borda `border-border`, `rounded-2xl`, sombra leve.
- **Form à direita**, tipografia alinhada à página de filme (`text-foreground`, labels `text-muted-foreground`).
- Fundo do dialog: `bg-background` / `bg-card`, `sm:max-w-[560px]` ou `600px`.

### Layout mobile

- Poster em faixa horizontal no topo (altura ~120px, crop) **ou** poster pequeno à esquerda do título — preferência: **poster compacto no topo** + form em scroll.

### Campos

| Campo | Obrigatório | Persistência |
|-------|-------------|--------------|
| Data | Sim (default hoje) | `watch_logs.watched_date` + `items_interactions.watched_date` (última) |
| Reassistida | Não | `rewatch_count` + novo `watch_index` |
| Nota | Não | `watch_logs.rating` + agregado em `items_interactions.rating` |
| Review | Não | `watch_logs.review` + agregado em `items_interactions.review` |
| Curtir | Não | `items_interactions.is_liked` |

### Ações do footer

- **Salvar** — cria/atualiza `watch_logs`, marca `is_watched = true`.
- **Cancelar**
- **Remover do diário** — só se editando log existente ou título já tem log; remove entrada específica ou último log (definir na implementação).
- Se só tinha olho sem log: “Remover assistido” no olho, não no dialog.

### Renomear copy

- Título dialog: **“Registrar no diário”** (não “Log watch”).
- Botão salvar: **“Salvar no diário”**.

---

## 3. Modelo de dados

### `items_interactions` (1 row por título)

| Campo | Uso |
|-------|-----|
| `is_watched` | Olhinho — na aba Assistidos |
| `is_liked` | Coração / toggle no dialog |
| `watched_date` | Data do **último** log (null se só olho, sem diário) |
| `rewatch_count` | Derivado dos logs ou incrementado no reassist |
| `rating`, `review` | Agregado do título (último log ou edição na página do filme) |

### `watch_logs` (1 row por assistida registrada)

- Só criado ao **Salvar no diário**.
- `watch_index`: 0 = 1ª, 1 = 2ª…
- `rating`, `review` opcionais **por log**.

### Regras

1. Olho ON sem nunca logar → `is_watched=true`, `watched_date=null`, **zero** `watch_logs`.
2. Salvar diário → `is_watched=true` + insert/upsert `watch_logs`.
3. Olho OFF → `is_watched=false`, limpar `watch_logs` desse título (ou bloquear se houver logs — **decisão:** desmarcar olho remove assistido e **todos** os logs, com confirmação).
4. Curtir sem assistir → permitido; curtir no dialog não exige log (só seta `is_liked`).

---

## 4. URLs e navegação

| Destino | Quando |
|---------|--------|
| `/film/{slug}` | Clique no Assistidos, catálogo, página global |
| `/{user}/film/{slug}` | 1º log no diário |
| `/{user}/film/{slug}/1` | 2ª assistida registrada |
| `/{user}/diary` | Nova aba Diário |
| `/{user}/watched` | Aba Assistidos (grid) |

**Não** gerar URL `/{user}/film/...` para título só com olho.

---

## 5. Migração de dados existentes

Usuários que já têm `is_watched` + `watched_date` mas sem `watch_logs` (backfill antigo):

- **Opção recomendada:** script one-shot que cria `watch_logs` com `watch_index=0` para cada `is_watched` com `watched_date` não nula.
- Títulos só com `is_watched` sem data → ficam só em Assistidos até o usuário registrar no diário.

---

## 6. Fases de implementação

### Fase A — Core (MVP aprovação)

1. `toggleWatched` nos cards: só `is_watched`, sem dialog.
2. Menu `⋯` no card + item “Registrar no diário…”.
3. Redesign `LogWatchDialog` (poster + curtir + campos).
4. `logWatch` só via dialog; não via olho.
5. Perfil: nova rota `/diary`, mover `WatchedDiary` → `DiaryPage`.
6. Perfil: `/watched` → novo componente **WatchedGrid** (posters, link `/film/...`).
7. Tabs: trocar Activity → Diary; redirect `/activity` → `/diary`.
8. Diário: links só para URLs com `watch_logs`.
9. Migração backfill `watch_logs`.

### Fase B — Polish

- Menu card: add to list, where to watch.
- Toast “Marcado! Registrar no diário?” com CTA.
- Editar log existente ao abrir dialog de título já no diário.
- i18n PT/EN nas strings novas.

### Fase C — Fora deste PR

- Feed substituir Activity social.
- Import Letterboxd respeitando watched vs diary.

---

## 7. Arquivos principais (estimativa)

| Área | Arquivos |
|------|----------|
| Dialog | `components/movies/log-watch-dialog.tsx` |
| Card menu | `components/movies/poster-actions-menu.tsx` (novo) |
| Cards | `movie-card.tsx`, `series-card.tsx` |
| Hook | `hooks/use-film-interactions.ts` |
| Perfil | `profile-tab-bar.tsx`, `watched/page.tsx`, `diary/page.tsx` (novo), `watched-grid.tsx` (novo) |
| Diário | `watched-diary.tsx` → renomear/ajustar `diary-view.tsx` |
| Layout | `app/[username]/(profile)/layout.tsx` |
| Migração | `supabase/migrations/20260721_watch_logs_backfill_v2.sql` (se necessário) |

---

## 8. Critérios de aceite

- [ ] Olho no card marca/desmarca em 1 clique, sem dialog.
- [ ] “Registrar no diário” abre dialog com poster visível e opção curtir.
- [ ] Assistidos mostra grid; Diário mostra calendário/lista por data.
- [ ] Só entradas do diário linkam para `/{user}/film/...`.
- [ ] Activity removida; `/activity` redireciona.
- [ ] Página do filme: olho rápido + botão registrar no diário.

---

## 9. Decisões para confirmar no approval

1. **Desmarcar olho** com logs existentes: apaga todos os logs com confirmação? (recomendado: sim)
2. **Nome da aba:** “Diário” ou “Diary”?
3. **Poster no dialog:** esquerda no desktop (proposto) — ok?
4. **Menu ⋯** no card na fase A ou só botão “+” ao lado do olho? (recomendado: ⋯ fase A mínimo com “Registrar no diário”)

---

*Documento gerado para approval antes da implementação.*
