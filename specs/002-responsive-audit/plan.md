# Implementation Plan: Responsiveness Audit & Fixes

**Branch**: `002-responsive-audit` | **Date**: 2026-05-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-responsive-audit/spec.md`

## Summary

Auditar todas as 17 rotas autenticadas do Highlight em viewports 375px, 768px e 1280px,
identificar elementos com overflow horizontal, áreas de toque insuficientes ou layouts
quebrados, e corrigir os problemas usando ajustes de classes Tailwind. Nenhuma nova
dependência, rota ou componente é introduzido — apenas refinamentos de classes CSS.

## Technical Context

**Language/Version**: TypeScript 5.x

**Primary Dependencies**: Tailwind v4 (CSS-first, `@theme`), Next.js 16 App Router, React 19

**Storage**: N/A — auditoria visual, sem alterações em dados ou banco

**Testing**: Visual manual via DevTools (Chrome/Firefox responsive mode) em 375px, 768px e 1280px. `npm run build` e `npm run lint` como gates de qualidade de código.

**Target Platform**: Browser (PWA mobile + desktop)

**Project Type**: Web application (PWA)

**Performance Goals**: N/A — nenhuma alteração de performance esperada

**Constraints**: Somente classes Tailwind — sem inline styles (Princípio I). Nenhuma nova dependência (Princípio VIII).

**Scale/Scope**: 17 rotas + 2 componentes de navegação (sidebar + MobileNav) + formulários

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate Question | Status |
|-----------|--------------|--------|
| I. Code Quality | Sem `any`, `console.log` ou inline styles nas correções | ✅ Pass — apenas ajustes de classes Tailwind |
| II. Testing Standards | Coverage ≥ 80% deve continuar passando após as correções | ✅ Pass — nenhum código de lógica alterado |
| III. UX Consistency | A auditoria MELHORA a experiência mobile — objetivo direto da feature | ✅ Pass |
| IV. Performance | Nenhuma alteração em cache, SM-2 ou cron | ✅ N/A |
| V. Clean Code | Correções são ajustes pontuais de classe — sem novas funções ou abstrações | ✅ Pass |
| VI. Simple UX | Cada correção serve um need documentado na spec (FR-001–FR-008) | ✅ Pass |
| VII. Responsible Design | Sem alteração em coleta de dados ou push | ✅ N/A |
| VIII. Minimal Dependencies | Zero novas dependências | ✅ Pass |
| Stack Constraints | Tailwind v4, Next.js 16 App Router — sem mudanças de stack | ✅ Pass |
| Quality Gates | `lint`, `test:coverage` e `build` devem passar sem alteração | ✅ Required |

## Project Structure

### Documentation (this feature)

```text
specs/002-responsive-audit/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 — mapeamento de rotas e padrões de problemas
├── data-model.md        # Phase 1 — inventário de telas e status de auditoria
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Arquivos que serão inspecionados e potencialmente corrigidos

```text
app/(app)/
├── layout.tsx                          # Sidebar + MobileNav — estrutura base
├── mobile-nav.tsx                      # Navegação mobile — já testado
├── page.tsx                            # Dashboard — grid 3 colunas, cards, listas
├── review/review-client.tsx            # Flashcards, filtros, modo Cinema
├── lessons/page.tsx                    # Lista de aulas
├── lessons/[id]/page.tsx               # Detalhe da aula + formulário de itens
├── lessons/[id]/add-item-form.tsx      # Formulário de adição (muitos campos)
├── lessons/[id]/edit-item-form.tsx     # Formulário de edição
├── lessons/[id]/transcript-extractor.tsx  # Extrator de texto
├── lessons/new/page.tsx                # Novo lesson form
├── media/page.tsx                      # Hub de mídia (grid de cards)
├── movies/page.tsx                     # Lista de filmes
├── music/page.tsx                      # Lista de músicas
├── books/page.tsx                      # Lista de livros
├── grammar/page.tsx                    # Lista de tópicos de gramática
├── grammar/[slug]/page.tsx             # Detalhe do tópico (tabelas, exemplos)
├── grammar/quiz/page.tsx               # Lista de quizzes
├── grammar/quiz/[slug]/quiz-client.tsx # Quiz interativo
└── roadmap/roadmap-client.tsx          # Trilha de aprendizado
```

**Structure Decision**: Sem nova estrutura de código. Correções aplicadas inline nos arquivos
existentes via ajustes de classes Tailwind.

## Phase 0: Research

### Padrões de problemas comuns identificados na inspeção inicial

| Padrão | Risco | Telas suspeitas |
|--------|-------|----------------|
| Grid fixo sem colapso mobile | Alto | Dashboard (`grid-cols-3`), Media hub |
| Texto longo sem truncate | Médio | Títulos de aulas, filmes, músicas |
| Pôsteres TMDB sem `max-w` definido | Médio | Modo Cinema no /review, /movies, /media |
| Formulários com campos lado a lado | Alto | add-item-form, edit-item-form |
| Tabelas/exemplos de gramática | Médio | grammar/[slug]/page.tsx |
| Botões pequenos em mobile | Médio | Controles de grade no /review |

### Abordagem de auditoria

1. Abrir cada rota no DevTools → Responsive Mode → iPhone SE (375×667)
2. Verificar: (a) sem scroll horizontal, (b) todos os elementos visíveis, (c) botões tocáveis
3. Anotar problemas com: rota, elemento, classe atual, classe corrigida
4. Aplicar correção e verificar em 375px, 768px e 1280px
5. Executar `npm run build` e `npm run lint` após todas as correções

### Padrões de correção Tailwind

| Problema | Correção típica |
|----------|----------------|
| Grid sem colapso | `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` |
| Texto overflow | Adicionar `truncate` ou `break-words` |
| Imagem sem max-w | Adicionar `max-w-full` ou `w-full object-cover` |
| Botão muito pequeno | Aumentar `p-` ou adicionar `min-h-[44px] min-w-[44px]` |
| Flex sem wrap | Adicionar `flex-wrap` |
| Espaçamento fixo | Substituir `p-8` por `p-4 md:p-8` |

## Phase 1: Design & Contracts

### Data Model (Inventário de Telas)

Sem entidades de banco de dados. Ver [data-model.md](./data-model.md) para o inventário
completo de telas com status de auditoria.

### Contratos

Não aplicável — feature é puramente visual, sem APIs ou interfaces externas.

### Agent Context

CLAUDE.md atualizado para apontar para `specs/002-responsive-audit/plan.md`.
