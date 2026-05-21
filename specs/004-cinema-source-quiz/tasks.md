# Tasks: Cinema Mode — Quiz por Origem da Mídia

**Input**: Design documents from `specs/004-cinema-source-quiz/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅

**Organization**: Tasks agrupadas por user story para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: User story correspondente (US1, US2)

---

## Phase 1: Setup

**Purpose**: Nenhuma infraestrutura nova necessária — feature modifica arquivos existentes da feature 003.

- [X] T001 Confirmar branch `004-cinema-source-quiz` e que o código da feature 003 está na base

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Server Actions de pool de títulos — DEVEM estar prontas antes das fases de UI.

**⚠️ CRÍTICO**: Nenhum trabalho de UI pode começar antes desta fase.

- [X] T002 Adicionar `fetchTitlePool(): Promise<string[]>` em `app/actions/review.ts` — busca `lessons.title` distintos de lições que têm flashcards do usuário (join: flashcards → lesson_items → lessons, filtrado por user_id, deduplicado)
- [X] T003 [P] Adicionar `fetchFallbackTitlePool(): Promise<string[]>` em `app/actions/review.ts` — busca `lessons.title` de todas as lições do usuário, excluindo títulos já no pool principal; usado apenas quando pool < 3

**Checkpoint**: Ambas as Server Actions implementadas antes de iniciar US1.

---

## Phase 3: User Story 1 — Quiz por Origem no Modo Cinema (Priority: P1) 🎯 MVP

**Goal**: No Modo Cinema, as 4 opções de resposta exibem títulos de filmes/séries/músicas em vez de traduções. Após a resposta, a tradução da palavra é revelada.

**Independent Test**: Iniciar uma sessão no Modo Cinema e verificar que: (1) cada card exibe 4 títulos de lições como opções A/B/C/D; (2) a opção correta é o título da lição de origem da palavra; (3) ao responder, a tradução PT-BR aparece no bloco de feedback; (4) SM-2 atualiza normalmente.

### Implementation for User Story 1

- [X] T004 [US1] Modificar assinatura de `buildCards` em `app/(app)/review/review-client.tsx` para aceitar parâmetro `mode: 'standard' | 'cinema'`
- [X] T005 [US1] No branch `mode === 'cinema'` de `buildCards` em `app/(app)/review/review-client.tsx`: chamar `fetchTitlePool()` (e fallback se < 3), definir `correct = card.lesson_items?.lessons?.title ?? card.back`, e chamar `buildMultipleChoiceOptions(correct, titlePool.filter(t => t !== correct))`
- [X] T006 [US1] Atualizar chamada de `buildCards` em `startCinema()` em `app/(app)/review/review-client.tsx` para passar `'cinema'` como mode; manter chamada em `startReview()` com `'standard'`
- [X] T007 [US1] No bloco de feedback pós-seleção do Modo Cinema (`selection !== null && cardMode === 'cinema'`) em `app/(app)/review/review-client.tsx`, adicionar bloco de tradução exibindo `card.back` antes do pôster/thumbnail

**Checkpoint**: Sessão Cinema exibe títulos como opções e revela tradução após resposta.

---

## Phase 4: User Story 2 — Distractors com Fallback (Priority: P2)

**Goal**: Usuários com poucos títulos de mídia ainda conseguem iniciar uma sessão Cinema com 4 opções distintas.

**Independent Test**: Com usuário que possui apenas 2 lições de mídia, iniciar Modo Cinema e verificar que 4 opções distintas aparecem (completadas com títulos de outras lições); com usuário sem nenhuma lição, verificar a mensagem de erro amigável.

### Implementation for User Story 2

- [X] T008 [US2] No branch `mode === 'cinema'` de `buildCards` em `app/(app)/review/review-client.tsx`, adicionar lógica de fallback: se `titlePool.length < 3` chamar `fetchFallbackTitlePool()` e fazer merge/dedup; se ainda `< 3` chamar `setInsufficientPool(true)` e retornar `[]`

**Checkpoint**: Sessão Cinema inicia normalmente com poucos títulos; mensagem de erro aparece quando impossível gerar 4 opções.

---

## Phase 5: Polish & Quality Gates

**Purpose**: Gates obrigatórios antes do PR.

- [ ] T009 [P] Rodar `npm run lint` e corrigir todos os erros nos arquivos modificados
- [ ] T010 [P] Rodar `npm run test:coverage` — verificar ≥ 80% coverage em todas as métricas
- [ ] T011 Rodar `npm run build` — confirmar build de produção sem erros TypeScript
- [ ] T012 Rodar `/review` — resolver todos os issues críticos antes de abrir PR
- [ ] T013 Criar PR com `gh pr create` (ou link manual) após T012 aprovado

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: Depende de Phase 1 — **bloqueia US1 e US2**
- **US1 (Phase 3)**: Depende de Phase 2 (T002 obrigatório)
- **US2 (Phase 4)**: T008 depende apenas de T002 e T003 (pode ser feito após Phase 2, em paralelo com US1 se desejado)
- **Polish (Phase 5)**: Depende de US1 + US2 completos

### User Story Dependencies

- **US1 (P1)**: Requer T002 (fetchTitlePool) da Foundational
- **US2 (P2)**: Requer T003 (fetchFallbackTitlePool) + a lógica de `buildCards` introduzida em T004–T006

### Paralelismo disponível

- T002 e T003 podem rodar em paralelo (mesmo arquivo, mas sem dependência entre si se editados na mesma sessão sequencialmente)
- T009 (lint) e T010 (test) podem rodar em paralelo após toda implementação

---

## Parallel Example: Phase 2

```
# T002 e T003 no mesmo arquivo — implementar em sequência na mesma sessão:
Task T002: "fetchTitlePool em app/actions/review.ts"
Task T003: "fetchFallbackTitlePool em app/actions/review.ts"
```

## Parallel Example: Phase 5

```
# Após toda implementação:
Task T009: "npm run lint"
Task T010: "npm run test:coverage"
```

---

## Implementation Strategy

### MVP (User Story 1 apenas)

1. Phase 1 (T001)
2. Phase 2 Foundational (T002–T003)
3. Phase 3 US1 (T004–T007)
4. **VALIDAR**: iniciar Modo Cinema manualmente no dev server
5. Se OK → Phase 4 US2 (T008) → Phase 5

### Incremental

1. T001–T003: base pronta
2. T004–T007 (US1): Cinema quiz com títulos funciona ✅
3. T008 (US2): Fallback para poucos títulos ✅
4. T009–T013: gates de qualidade e PR

---

## Notes

- Esta feature modifica **apenas 2 arquivos** de código: `app/actions/review.ts` e `app/(app)/review/review-client.tsx`
- O componente `MultipleChoiceOptions` da feature 003 é reutilizado sem nenhuma modificação
- A função `buildMultipleChoiceOptions` em `review-utils.ts` é reutilizada sem modificação — é agnóstica ao tipo de string passada
- O modo normal (revisão de traduções) **não é afetado** por nenhuma dessas mudanças
