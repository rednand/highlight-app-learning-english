# Data Model: Responsiveness Audit Inventory

**Date**: 2026-05-20 | **Branch**: `002-responsive-audit`

Sem entidades de banco de dados. Este arquivo serve como inventário de telas a auditar,
com status de auditoria e problemas identificados.

## Inventário de Telas

| Rota | Arquivo principal | Prioridade | Status audit | Resultado |
|------|-------------------|-----------|--------------|-----------|
| `/` | `app/(app)/page.tsx` | Alta | 🔧 Corrigido | `xs:inline` → `sm:inline`. Grid stats 3 cols OK em 375px com p-3 compacto. |
| `/review` | `app/(app)/review/review-client.tsx` | Alta | ✅ OK | `max-w-md mx-auto`, grade buttons `grid-cols-3 py-3` (≥44px), cinema com imagens fixas pequenas (80×120 e 96×96). |
| `/lessons` | `app/(app)/lessons/page.tsx` | Alta | ✅ OK | Header `flex justify-between`, LessonsClient com `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. |
| `/lessons/[id]` | `app/(app)/lessons/[id]/page.tsx` | Alta | ✅ OK | `max-w-2xl mx-auto p-4 md:p-8`. |
| `/lessons/[id]` (add-item) | `app/(app)/lessons/[id]/add-item-form.tsx` | Alta | ✅ OK | Modal `fixed inset-0 p-4`, inner `w-full max-w-lg max-h-[90vh] overflow-y-auto`, `grid-cols-1 sm:grid-cols-2`. |
| `/lessons/[id]` (edit-item) | `app/(app)/lessons/[id]/edit-item-form.tsx` | Média | ✅ OK | Mesma estrutura de modal do add-item. |
| `/lessons/new` | `app/(app)/lessons/new/page.tsx` | Média | ✅ OK | Form `p-4 md:p-8`, campos em stack vertical. |
| `/media` | `app/(app)/media/page.tsx` | Média | ✅ OK | Carousels horizontais com `overflow-x-auto scrollbar-none` — intencional e controlado. |
| `/movies` | `app/(app)/movies/page.tsx` | Média | ✅ OK | `grid-cols-2 sm:grid-cols-3...`, imagens com `fill` e `sizes` corretos. |
| `/music` | `app/(app)/music/page.tsx` | Média | ✅ OK | Padrão igual ao movies. |
| `/books` | `app/(app)/books/page.tsx` | Baixa | ✅ OK | Padrão igual ao movies. |
| `/grammar` | `app/(app)/grammar/page.tsx` | Média | ✅ OK | Lista simples com flex. |
| `/grammar/[slug]` | `app/(app)/grammar/[slug]/page.tsx` | Média | ✅ OK | `max-w-2xl mx-auto`, flex-wrap para tags, sem tabelas HTML. |
| `/grammar/quiz` | `app/(app)/grammar/quiz/page.tsx` | Baixa | ✅ OK | Lista de quizzes responsiva. |
| `/grammar/quiz/[slug]` | `app/(app)/grammar/quiz/[slug]/quiz-client.tsx` | Média | ✅ OK | Opções em stack, tela de resultado centrada. |
| `/roadmap` | `app/(app)/roadmap/roadmap-client.tsx` | Baixa | ✅ OK | `flex flex-wrap gap-2` nos botões de sessão. |
| Layout base | `app/(app)/layout.tsx` | Alta | ✅ OK | Sidebar `hidden md:flex`, MobileNav, `pb-16 md:pb-0`. |
| MobileNav | `app/(app)/mobile-nav.tsx` | Alta | ✅ OK | Testado em `__tests__/mobile-nav.test.tsx`. |

## Critérios de Auditoria por Tela

Para cada tela, verificar em **375px**, **768px** e **1280px**:

1. **Sem overflow horizontal** — nenhuma barra de scroll horizontal
2. **Texto visível** — sem truncamento inesperado ou sobreposição
3. **Imagens contidas** — dentro do container, sem distorção
4. **Botões tocáveis** — área ≥ 44×44px nos controles principais
5. **Formulários usáveis** — todos os campos visíveis e acessíveis

## Status de conclusão

Legenda: `Pendente` → `Em auditoria` → `✅ OK` / `🔧 Corrigido`

*Este arquivo será atualizado durante a execução das tasks de auditoria.*
