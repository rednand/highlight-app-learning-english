# Research: Responsiveness Audit & Fixes

**Date**: 2026-05-20 | **Branch**: `002-responsive-audit`

## Decisões

| Tópico | Decisão | Rationale |
|--------|---------|-----------|
| Ferramenta de teste | DevTools responsive mode (Chrome/Firefox) | Disponível sem setup; simula viewports com precisão suficiente para auditoria visual |
| Viewport primário | 375px (iPhone SE) | Menor dispositivo comum; se passar aqui, passa em telas maiores |
| Viewports secundários | 768px (tablet / md breakpoint) e 1280px (desktop) | Cobre os 3 cenários do Tailwind: sm/md/lg |
| Abordagem de correção | Somente classes Tailwind, nenhuma mudança de estrutura | Mantém conformidade com Princípio I (sem inline styles) e Princípio VIII (sem deps) |
| Prioridade de correção | Dashboard → Review → Lessons → Media → Grammar → Roadmap | Ordem de frequência de uso |

## Inspeção inicial do layout base

O `layout.tsx` já implementa o padrão correto:
- Sidebar: `hidden md:flex` — só aparece em ≥ 768px ✅
- MobileNav: renderizado para todos, se posiciona no fundo ✅
- Main: `pb-16 md:pb-0` — padding bottom para não sobrepor o MobileNav ✅

O Dashboard (`page.tsx`) usa `p-4 md:p-8` e `grid-cols-3` — o grid 3 colunas
pode ser problemático em 375px dependendo do conteúdo de cada card.

## Padrões de classes Tailwind identificados no projeto

O projeto usa consistentemente:
- `p-4 md:p-8` para padding de páginas — correto
- `text-xs sm:text-sm` para tipografia responsiva — correto
- `max-w-2xl mx-auto` em páginas de detalhe — correto (limita largura em desktop)
- `hidden xs:inline` em alguns botões — usa breakpoint `xs` que pode não estar definido no theme

**Atenção**: O breakpoint `xs` (`hidden xs:inline`) pode não existir no Tailwind v4 sem
configuração explícita. Verificar se está definido em `globals.css` via `@theme`.
