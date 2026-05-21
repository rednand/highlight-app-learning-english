# Implementation Plan: Cinema Mode — Quiz por Origem da Mídia

**Branch**: `004-cinema-source-quiz` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-cinema-source-quiz/spec.md`

## Summary

Altera o Modo Cinema para que as 4 opções de múltipla escolha exibam **títulos de filmes/séries/músicas** em vez de traduções de palavras. O usuário deve identificar em qual obra ouviu a palavra. Após a resposta, a tradução correta é revelada. Reutiliza integralmente a infraestrutura da feature 003 (`buildMultipleChoiceOptions`, `MultipleChoiceOptions` component, SM-2 grading) — apenas o conteúdo do pool e o feedback mudam.

## Technical Context

**Language/Version**: TypeScript 5 / Next.js 16 App Router

**Primary Dependencies**: React 19, Tailwind v4, Supabase JS client

**Storage**: PostgreSQL via Supabase (sem alterações de schema)

**Testing**: Vitest (`npm run test:coverage`, ≥ 80% coverage)

**Target Platform**: Web PWA (Vercel), mobile-first

**Performance Goals**: Novo pool de títulos fetched uma vez por sessão, em paralelo com `fetchFlashcards`

**Constraints**: Sem novos pacotes npm; sem `any`; mutations via Server Actions

**Scale/Scope**: ~2 arquivos modificados, 2 Server Actions adicionadas

## Constitution Check

| Princípio | Questão | Status |
|-----------|---------|--------|
| I. Code Quality | Sem `any`, sem `console.log`, sem Supabase direto em Client Components? | ✅ |
| II. Testing | Lógica de pool de títulos é simples (deduplicação); testes existentes cobrem `buildMultipleChoiceOptions`; Server Actions seguem o mesmo padrão já testado | ✅ |
| III. UX Consistency | Atalhos de teclado, mobile, pt-BR preservados (sem mudanças nessas áreas) | ✅ |
| IV. Performance | SM-2 síncrono; pool fetched uma vez; sem round-trips extras | ✅ |
| V. Clean Code | Mudanças mínimas e focadas; sem abstrações prematuras | ✅ |
| VI. Simple UX | Cada botão serve FR documentado | ✅ |
| VII. Responsible Design | Sem nova coleta de dados | ✅ |
| VIII. Minimal Deps | Sem novos pacotes | ✅ |
| Stack Constraints | Next.js 16 App Router, Tailwind v4, Supabase, Vercel | ✅ |
| Quality Gates | lint → test:coverage → build → /review → PR | ✅ |

## Project Structure

### Documentação (esta feature)

```text
specs/004-cinema-source-quiz/
├── plan.md         ← este arquivo
├── research.md     ← Phase 0 output
├── data-model.md   ← Phase 1 output
└── tasks.md        ← Phase 2 output (/speckit-tasks)
```

### Arquivos de código (afetados)

```text
app/
├── actions/
│   └── review.ts           # ADD fetchTitlePool, fetchFallbackTitlePool
└── (app)/
    └── review/
        └── review-client.tsx   # MODIFY buildCards + cinema feedback
```

**Nenhum novo arquivo de componente.** O `MultipleChoiceOptions` component da feature 003 é reutilizado sem modificação.

## Fases de Implementação

### Fase 1 — Server Actions

**Objetivo**: Expor o pool de títulos de lições.

**`app/actions/review.ts`** — Adicionar:

```ts
export async function fetchTitlePool(): Promise<string[]>
```
- Busca `lessons.title` de lições que têm flashcards do usuário.
- Join: `flashcards → lesson_item_id → lesson_items.lesson_id → lessons.title`.
- Retorna strings deduplicadas.

```ts
export async function fetchFallbackTitlePool(): Promise<string[]>
```
- Busca `lessons.title` de **todas** as lições do usuário (sem flashcards também).
- Exclui títulos já retornados por `fetchTitlePool`.
- Usado somente quando pool principal < 3.

---

### Fase 2 — Refactor de `buildCards` no review-client

**Objetivo**: Usar pool de títulos para cinema e pool de traduções para standard.

**`app/(app)/review/review-client.tsx`** — Modificar `buildCards`:

```ts
async function buildCards(
  fetched: Flashcard[],
  mode: 'standard' | 'cinema',
): Promise<MultipleChoiceCard[]>
```

- `mode === 'standard'`: comportamento atual (pool de `back` via `fetchDistractorPool`)
- `mode === 'cinema'`:
  - Busca `fetchTitlePool()` + fallback se necessário
  - `correct = card.lesson_items?.lessons?.title ?? card.back`
  - `pool = titlePool.filter(t => t !== correct)`
  - Chama `buildMultipleChoiceOptions(correct, pool)`

Atualizar chamadas em `startReview` e `startCinema`:
- `startReview(lessonId)` → `buildCards(fetched, 'standard')`
- `startCinema()` → `buildCards(filtered, 'cinema')`

---

### Fase 3 — Revelar tradução no feedback Cinema

**Objetivo**: Exibir `card.back` após a seleção no Modo Cinema.

**`app/(app)/review/review-client.tsx`** — No bloco `selection !== null && cardMode === 'cinema'`:

Adicionar antes do pôster/thumbnail:

```tsx
<div className="mt-3 pt-3 border-t border-white/5">
  <p className="text-[10px] text-gray-600 uppercase font-bold tracking-wider mb-1">Tradução</p>
  <p className="text-white text-lg font-semibold">{card.back}</p>
</div>
```

A tradução é revelada **apenas** após a seleção (dentro do bloco `selection !== null`) — não visível durante a escolha.

---

### Fase 4 — Quality Gates

```bash
npm run lint          # zero ESLint errors
npm run test:coverage # ≥ 80% coverage
npm run build         # production build OK
/review               # sem issues críticos
gh pr create          # após review limpo
```

## Complexity Tracking

Nenhuma violação da constituição. Sem entradas necessárias.
