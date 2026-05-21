# Research: Cinema Mode — Quiz por Origem da Mídia

**Feature**: 004-cinema-source-quiz
**Date**: 2026-05-21

---

## Contexto herdado da feature 003

A feature 003 (`003-flashcard-multiple-choice`) já implementou:
- `buildMultipleChoiceOptions(correct: string, pool: string[]): ChoiceOption[]` — função pura, agnóstica ao tipo de conteúdo das opções
- `MultipleChoiceOptions` component — renderiza 4 opções A–D com feedback visual
- `buildCards` em `review-client.tsx` — monta os cards com `.options` usando pool de traduções
- `fetchDistractorPool()` — busca traduções (`flashcards.back`) do usuário

Esta feature **reutiliza toda essa infraestrutura**, alterando apenas o que é passado como `correct` e `pool` no modo cinema.

---

## Decision 1: Conteúdo das opções no Modo Cinema

**Decision**: No Modo Cinema, `correct = card.lesson_items.lessons.title` e `pool = títulos de todas as lições do usuário` (em vez de `card.back` e pool de traduções).

**Rationale**: A função `buildMultipleChoiceOptions` é agnóstica ao conteúdo — aceita qualquer string. Passar o título da lição como "correct" e um pool de outros títulos como distractors resolve o requisito sem modificar a lógica central de shuffle/deduplicate.

**Alternatives considered**:
- Criar uma nova função separada para o modo cinema: desnecessário — `buildMultipleChoiceOptions` já é genérica.

---

## Decision 2: Pool de títulos para distractors

**Decision**: Novo Server Action `fetchTitlePool(): Promise<string[]>` que busca todos os `lessons.title` distintos das lições que têm flashcards do usuário.

**Rationale**: Prioriza títulos de lições que o usuário realmente usa (tem flashcards), tornando os distractors mais relevantes. Paraleliza com `fetchFlashcards()` na inicialização da sessão, sem round-trips extras.

**Fallback**: Se `titlePool.length < 3`, buscar títulos de todas as lições do usuário (mesmo sem flashcards) via `fetchFallbackTitlePool()`.

**Alternatives considered**:
- Reutilizar `fetchDistractorPool()` com títulos: não funciona — essa action busca `flashcards.back` (traduções).
- Extrair títulos dos cards já carregados: viável mas incompleto (apenas lições com cards devidos, não todo o vocabulário).

---

## Decision 3: Revelar tradução após resposta

**Decision**: No Modo Cinema, após o usuário selecionar uma opção (correta ou errada), exibir `card.back` (tradução PT-BR) na área de feedback pós-seleção — abaixo das opções e antes do avanço automático.

**Rationale**: A spec (FR-005 e US1 Acceptance Scenario 5) exige que a tradução seja revelada após a resposta. Isso reforça o aprendizado: o usuário conecta a palavra ao contexto de mídia E confirma sua tradução.

**Implementation note**: O bloco de feedback `selection !== null && cardMode === 'cinema'` já existe no `review-client.tsx` (mostra o pôster). Basta adicionar a tradução nesse bloco, que já é renderizado após a seleção.

---

## Decision 4: Separação de pools por modo

**Decision**: `buildCards` recebe um parâmetro de modo (`'standard' | 'cinema'`) e chama o pool correto:
- Standard: `fetchDistractorPool()` → pool de `back` (traduções)
- Cinema: `fetchTitlePool()` → pool de `lessons.title` (títulos)

**Rationale**: Mantém `buildCards` como único ponto de construção de cards, com branching explícito por modo. Evita duplicar toda a lógica de fallback.

---

## Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| `app/actions/review.ts` | ADD `fetchTitlePool()`, `fetchFallbackTitlePool()` |
| `app/(app)/review/review-client.tsx` | MODIFY `buildCards` (mode param + title pool para cinema), UPDATE feedback cinema (add translation reveal) |
| `app/lib/review-utils.test.ts` | Sem mudanças necessárias — `buildMultipleChoiceOptions` é reutilizada sem alteração |

Nenhum novo pacote npm. Nenhuma mudança de schema.
