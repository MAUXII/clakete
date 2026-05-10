# Plano: criador de lista em `/list/new` (sem modal)

Documento vivo para alinhar implementação. Origem: plano Cursor “Implementar Step 1 em /list/new sem modal”, atualizado com o que já existe no repositório.

---

## Objetivo

Entregar o criador de lista em **página dedicada** (`/list/new`), em formato onboarding, **sem depender do modal** (`CreateListDialog`) nos gatilhos de criação. Dividir em **steps**; persistir no Supabase quando o fluxo exigir.

## Escopo original

- Rota: **`/list/new`** (singular)
- **Modal:** botões “criar lista” redirecionam para a rota (não abrir dialog)
- Fase 1: entregar **Step 1**; steps seguintes depois

## Arquivos-chave

| Área | Caminho |
|------|---------|
| Página nova lista | `app/list/new/page.tsx` |
| Gatilhos (perfil, etc.) | `components/profile/user-lists.tsx` |
| Hook listas | `hooks/use-lists.ts` |
| Tipos | `types/list.ts` |
| Footer global | `components/ui/conditional-footer.tsx` (ocultar em `/list/new` se necessário) |

---

## Step 1 — critérios de aceite (baseline)

- [x] Abrir fluxo de “nova lista” leva a `/list/new`
- [x] Tela dedicada, layout alinhado à página pública de lista (`FilmsCatalogShell`, banner grande)
- [x] Banner via **TMDB + crop** (`ImageEditDialog`, `ListBannerMeta`) — não URL manual
- [x] Título obrigatório para habilitar **Continuar**
- [x] Descrição (bio) opcional
- [x] Indicador visual de 3 steps (barras no topo)
- [ ] **Tags** (até 3, sem duplicata) — *previsto no plano inicial; ainda não está na página atual*
- [ ] Botão **Continuar**: navegar para **Step 2** ou persistir draft — *hoje não avança de step nem grava*

## Estado atual no código (`app/list/new/page.tsx`)

- Step 1 só em **estado local**: `title`, `bio`, `bannerMeta`
- `Continuar` não tem `onClick` / rota para o próximo passo
- Tags removidas da UI atual (se quiserem o produto com tags, reintroduzir aqui)
- `listId="draft-new-list"` no banner — placeholder até existir lista no banco

---

## Próximos passos (sugerido)

1. **Step 2 — conteúdo**  
   Busca/adicionar filmes ou séries (alinhado ao `ListMediaType` / `useLists` / itens de lista).

2. **Step 3 — publicar**  
   Visibilidade, resumo, `createList` no Supabase com payload completo (título, descrição, banner meta, itens).

3. **Persistência**  
   Opções: criar lista “draft” no Step 1 e ir atualizando, ou criar só no final — decidir e documentar aqui.

4. **Navegação**  
   Ao concluir: redirecionar para `/{username}/list/{slug}` (ou rota equivalente do app).

5. **Limpeza**  
   Remover ou manter `CreateListDialog` só se ainda houver uso; alinhar navbar/footer em todas as steps.

---

## Desacoplamento do modal (checklist)

- [x] Gatilhos em `user-lists.tsx` → `router.push("/list/new")` (confirmar no arquivo se ainda está assim)
- [ ] Nenhum entry point abrindo `CreateListDialog` para o fluxo principal

---

## Notas

- O `.gitignore` deste repo ignora `*.md`; este arquivo está explicitamente liberado para versionamento (`!docs/plano-list-new.md`).
