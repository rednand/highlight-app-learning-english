---
description: "Task list for Responsiveness Audit & Fixes"
---

# Tasks: Responsiveness Audit & Fixes

**Input**: Design documents from `specs/002-responsive-audit/`

**Branch**: `002-responsive-audit` | **Date**: 2026-05-20

**Organization**: Tasks grouped by user story. Each story can be validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: User story (US1, US2, US3)

---

## Phase 1: Setup (Infraestrutura compartilhada)

**Purpose**: Verificar pré-requisitos antes de iniciar a auditoria.

- [x] T001 Verificar se o breakpoint `xs` está definido em `app/globals.css` via `@theme`; se não estiver, remover ou substituir as classes `xs:` por `sm:` nos arquivos que as usam
- [x] T002 Rodar `npm run build` para confirmar que o baseline compila sem erros antes de qualquer alteração

**Checkpoint**: Build passando limpo — pronto para iniciar auditoria.

---

## Phase 2: Foundational (Pré-requisitos bloqueantes)

**Purpose**: Verificar e corrigir o layout base antes de auditar as páginas.

**⚠️ CRÍTICO**: Problemas no layout base afetam todas as telas — resolver primeiro.

- [x] T003 Auditar `app/(app)/layout.tsx` em 375px, 768px e 1280px — confirmar sidebar `hidden md:flex`, MobileNav posicionado, `pb-16 md:pb-0` no main
- [x] T004 Auditar `app/(app)/mobile-nav.tsx` em 375px — confirmar que todos os links têm área de toque ≥ 44×44px e que o menu "Mais" abre/fecha corretamente

**Checkpoint**: Layout base e navegação funcionando em todos os viewports.

---

## Phase 3: User Story 1 — Auditar todas as telas em mobile (Priority: P1) 🎯 MVP

**Goal**: Mapear e corrigir todos os problemas de overflow horizontal e layout em 375px nas telas de maior uso (Dashboard, Review, Lessons).

**Independent Test**: Abrir `/`, `/review` e `/lessons` em 375px no DevTools — nenhuma barra de scroll horizontal visível.

### Dashboard

- [x] T005 [US1] Auditar `app/(app)/page.tsx` em 375px — verificar `grid-cols-3` (stats), wrapping de cards de aulas recentes, pôsteres de mídia recente, e botão "Nova Aula" com `hidden xs:inline`; corrigir overflow se encontrado

### Review

- [x] T006 [US1] Auditar `app/(app)/review/review-client.tsx` em 375px — verificar botões de grade (Não lembro/Quase/Fácil), tabs de filtro, seletor de aulas, e pôster no Modo Cinema; garantir área de toque ≥ 44×44px nos botões de grade

### Lessons

- [x] T007 [P] [US1] Auditar `app/(app)/lessons/page.tsx` em 375px — verificar lista de aulas, badges de contagem, datas; corrigir overflow ou truncamento incorreto
- [x] T008 [P] [US1] Auditar `app/(app)/lessons/[id]/page.tsx` em 375px — verificar cabeçalho da aula, lista de itens e área de adição de vocabulário
- [x] T009 [US1] Auditar `app/(app)/lessons/[id]/add-item-form.tsx` em 375px — verificar campos de texto (term, translation, context, phonetic, my_sentence), garantir que todos os campos são acessíveis sem scroll horizontal e que o botão de submit é tocável
- [x] T010 [P] [US1] Auditar `app/(app)/lessons/[id]/edit-item-form.tsx` em 375px — mesmos critérios do add-item-form
- [x] T011 [P] [US1] Auditar `app/(app)/lessons/new/page.tsx` e `app/(app)/lessons/new/new-lesson-form.tsx` em 375px — verificar formulário de nova aula e media picker

**Checkpoint**: Dashboard, Review e Lessons funcionam em 375px sem overflow. Botões de revisão tocáveis.

---

## Phase 4: User Story 2 — Corrigir problemas (telas secundárias) (Priority: P2)

**Goal**: Estender a auditoria para Media, Grammar e Roadmap, e aplicar correções nos problemas identificados.

**Independent Test**: Abrir `/media`, `/grammar` e `/roadmap` em 375px — layout correto sem overflow.

### Media hub

- [x] T012 [P] [US2] Auditar `app/(app)/media/page.tsx` em 375px — verificar grid de cards de filmes/músicas/livros; corrigir para `grid-cols-1 sm:grid-cols-2` se necessário
- [x] T013 [P] [US2] Auditar `app/(app)/movies/page.tsx` em 375px — verificar grid de pôsteres TMDB; garantir `max-w-full` nas imagens
- [x] T014 [P] [US2] Auditar `app/(app)/music/page.tsx` em 375px — verificar thumbnails de músicas e artistas
- [x] T015 [P] [US2] Auditar `app/(app)/books/page.tsx` em 375px — verificar capas de livros e títulos longos

### Grammar

- [x] T016 [P] [US2] Auditar `app/(app)/grammar/page.tsx` em 375px — verificar lista de tópicos e badges de nível (A1–C2)
- [x] T017 [P] [US2] Auditar `app/(app)/grammar/[slug]/page.tsx` em 375px — verificar tabelas de estrutura gramatical e blocos de exemplos; aplicar `overflow-x-auto` em tabelas se necessário
- [x] T018 [P] [US2] Auditar `app/(app)/grammar/quiz/page.tsx` em 375px — verificar lista de quizzes
- [x] T019 [US2] Auditar `app/(app)/grammar/quiz/[slug]/quiz-client.tsx` em 375px — verificar opções de múltipla escolha, feedback de resposta e tela de resultado

### Roadmap

- [x] T020 [P] [US2] Auditar `app/(app)/roadmap/roadmap-client.tsx` em 375px — verificar sessões expansíveis, badges de progresso e links para aulas

**Checkpoint**: Todas as 17 rotas auditadas. Todos os problemas corrigidos ou documentados.

---

## Phase 5: User Story 3 — Validar tablet (Priority: P3)

**Goal**: Confirmar que o breakpoint md (768px) funciona corretamente em todas as telas.

**Independent Test**: Abrir cada rota em 768px — sidebar visível, MobileNav ausente, sem overflow.

- [x] T021 [US3] Verificar `app/(app)/layout.tsx` em exatamente 768px — confirmar que sidebar aparece e MobileNav some exatamente no breakpoint `md:`
- [x] T022 [P] [US3] Verificar Dashboard `/` em 768px e 1024px — confirmar que o grid de stats e cards se expande adequadamente
- [x] T023 [P] [US3] Verificar `/review` em 768px — confirmar que flashcard e controles usam espaço adicional sem quebrar
- [x] T024 [P] [US3] Verificar `/grammar/[slug]` em 768px — confirmar que tabelas de estrutura gramatical são legíveis sem scroll horizontal

**Checkpoint**: Todas as telas funcionam corretamente em 768px — transição sidebar ↔ MobileNav sem problemas.

---

## Phase 6: Polish & Validação final

**Purpose**: Garantir que todas as correções não quebraram build, lint ou testes.

- [x] T025 Rodar `npm run lint` após todas as correções — corrigir qualquer erro introduzido pelas alterações de classes
- [x] T026 Rodar `npm run test:coverage` — confirmar que os 103 testes continuam passando (nenhuma lógica alterada)
- [x] T027 Rodar `npm run build` — confirmar que a build de produção compila sem erros
- [x] T028 Atualizar `specs/002-responsive-audit/data-model.md` — marcar status de auditoria de cada tela como `✅ OK` ou `🔧 Corrigido` com descrição da correção aplicada

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — iniciar imediatamente
- **Foundational (Phase 2)**: Depende do Setup (T001–T002)
- **US1 (Phase 3)**: Depende do Foundational (T003–T004)
- **US2 (Phase 4)**: Depende do Foundational (T003–T004); tarefas T012–T020 são paralelas entre si
- **US3 (Phase 5)**: Depende de US1 e US2 estarem completos
- **Polish (Phase 6)**: Depende de todas as fases anteriores

### Parallel Opportunities

Dentro da Phase 3 (US1), T007–T011 tocam arquivos diferentes:
```
T007 lessons/page.tsx              ─┐
T008 lessons/[id]/page.tsx         ─┤ Paralelo após T006 (review)
T010 lessons/[id]/edit-item-form   ─┤
T011 lessons/new/page.tsx          ─┘
```

Dentro da Phase 4 (US2), T012–T020 são todos paralelos:
```
T012 media/page.tsx        ─┐
T013 movies/page.tsx       ─┤
T014 music/page.tsx        ─┤
T015 books/page.tsx        ─┤ Todos paralelos — arquivos independentes
T016 grammar/page.tsx      ─┤
T017 grammar/[slug]        ─┤
T018 grammar/quiz/page.tsx ─┤
T019 quiz-client.tsx       ─┤
T020 roadmap-client.tsx    ─┘
```

---

## Implementation Strategy

### MVP First (User Story 1 — telas de maior uso)

1. T001–T002: Setup e baseline
2. T003–T004: Layout base
3. T005–T011: Dashboard, Review, Lessons
4. **STOP e VALIDE**: Abre `/`, `/review`, `/lessons` em 375px — sem overflow
5. Entrega valor imediato: as telas mais usadas estão responsivas

### Incremental Delivery

1. Setup + Foundational → baseline limpo
2. US1 → telas críticas responsivas
3. US2 → todas as telas responsivas
4. US3 → tablet validado
5. Polish → build/lint/tests passando, inventário atualizado

---

## Notes

- Todas as correções DEVEM usar classes Tailwind — sem inline styles (Princípio I da constituição)
- Nenhuma nova dependência deve ser adicionada (Princípio VIII)
- Se uma tabela de gramática for difícil de corrigir sem overflow, usar `overflow-x-auto` no container — isso é aceitável e controlado
- O breakpoint `xs:` não é padrão no Tailwind — verificar T001 antes de qualquer outra coisa
- Após cada correção, confirmar visualmente nos 3 viewports antes de marcar como concluído
