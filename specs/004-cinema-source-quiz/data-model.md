# Data Model: Cinema Mode — Quiz por Origem da Mídia

**Feature**: 004-cinema-source-quiz
**Date**: 2026-05-21

---

## Nenhuma mudança de schema

O schema do banco de dados (`lessons`, `lesson_items`, `flashcards`) não é modificado.

---

## Mudanças em tipos runtime (TypeScript — sem migração de DB)

### `MultipleChoiceCard` (sem alteração de estrutura)

```ts
type MultipleChoiceCard = Flashcard & {
  options: ChoiceOption[]  // continua igual
}
```

No Modo Cinema, `options` agora contém **títulos de lições** em vez de traduções. A estrutura do tipo permanece idêntica — apenas o conteúdo das strings muda.

---

## Novo campo semântico por modo

| Campo | Modo Standard | Modo Cinema |
|-------|---------------|-------------|
| `options[n].text` | Tradução PT-BR (`card.back`) | Título da lição (`lessons.title`) |
| `options[n].isCorrect` | `text === card.back` | `text === card.lesson_items.lessons.title` |
| Feedback pós-seleção | Exibe `my_sentence` + pôster | Exibe **tradução** (`card.back`) + pôster |

---

## Novos Server Actions

### `fetchTitlePool(): Promise<string[]>`

Localização: `app/actions/review.ts`

- Busca todos os `lessons.title` distintos das lições que possuem pelo menos um flashcard do usuário.
- Join: `flashcards → lesson_items → lessons`, filtrando por `user_id`.
- Retorna array de strings deduplicado.

```
flashcards (user_id = X)
  → lesson_item_id → lesson_items.lesson_id
  → lesson_id → lessons.title
```

### `fetchFallbackTitlePool(): Promise<string[]>`

Localização: `app/actions/review.ts`

- Busca `lessons.title` de **todas** as lições do usuário (mesmo sem flashcards), excluindo títulos já presentes no pool principal.
- Usado somente quando `fetchTitlePool()` retorna menos de 3 resultados.

---

## Fluxo de inicialização da sessão Cinema (atualizado)

```
1. startCinema() chamado
2. Em paralelo:
   a. fetchFlashcards(undefined) → Flashcard[]
      → filtrar source_type === 'movie' | 'music'
   b. fetchTitlePool() → string[] (títulos das lições com flashcards)
3. Se titlePool.length < 3:
   c. fetchFallbackTitlePool() → string[] (títulos adicionais)
      → merge e deduplicar
4. Se pool ainda < 3 → setInsufficientPool(true), retornar []
5. Para cada card cinema:
   correct = card.lesson_items?.lessons?.title ?? ''
   options = buildMultipleChoiceOptions(correct, titlePool.filter(t => t !== correct))
6. setCards(multipleChoiceCards)
```

---

## Fluxo de feedback pós-seleção Cinema (atualizado)

```
Usuário seleciona opção
  → setSelection({ selectedLabel, isCorrect })
  → Exibe:
      ① Feedback visual nas opções (verde/vermelho)
      ② Bloco de tradução: card.back (revelado)
      ③ Pôster/thumbnail da mídia correta
  → Após 1500ms: updateFlashcard(sm2 grade 5 ou 1) + avança
```

A tradução (`card.back`) é revelada APENAS após a seleção — não fica visível enquanto o usuário está escolhendo, para não dar dica sobre a palavra.
