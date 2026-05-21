# Tasks: PWA Install Prompt

**Input**: Design documents from `specs/005-pwa-install-prompt/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅

**Organization**: Tasks agrupadas por user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: User story correspondente (US1, US2)

---

## Phase 1: Setup

**Purpose**: Nenhuma infraestrutura nova necessária.

- [X] T001 Confirmar branch `005-pwa-install-prompt` ativa

---

## Phase 2: Foundational

**Purpose**: Não há pré-requisitos bloqueantes além do setup — esta feature é autocontida.

*(Fase vazia — prosseguir direto para US1)*

---

## Phase 3: User Story 1 — Banner de Instalação (Priority: P1) 🎯 MVP

**Goal**: Exibir um banner fixo no rodapé sempre que o usuário acessar o app pelo navegador e o PWA não estiver instalado, com botões "Instalar" e "Fechar".

**Independent Test**: Acessar o app no Chrome desktop (sem estar instalado), verificar que o banner aparece no rodapé com os dois botões; clicar "Instalar" e confirmar que o diálogo nativo do Chrome abre; recarregar e confirmar que o banner reaparece; clicar "Fechar" e confirmar que o banner desaparece pelo restante da sessão.

### Implementation for User Story 1

- [X] T002 [US1] Criar `components/pwa-install-banner.tsx` como Client Component — declarar interface `BeforeInstallPromptEvent`; estados `deferredPrompt` e `dismissed`; `useEffect` registrando listeners para `beforeinstallprompt` (chama `e.preventDefault()`, armazena evento) e `appinstalled` (limpa evento); renderizar `null` quando `deferredPrompt === null` ou `dismissed === true`
- [X] T003 [US1] Implementar JSX do banner em `components/pwa-install-banner.tsx` — container `fixed bottom-0 left-0 right-0 z-[65] p-4 pb-20 md:pb-4`; card com ícone do app, título "Instalar o Highlight", subtítulo "Acesse mais rápido direto da sua tela inicial", botão primário amarelo "Instalar" e botão secundário "Agora não"; texto em pt-BR
- [X] T004 [US1] Implementar `handleInstall` em `components/pwa-install-banner.tsx` — chama `deferredPrompt.prompt()`, aguarda `deferredPrompt.userChoice`, se `outcome === 'accepted'` limpa `deferredPrompt` (banner desaparece)
- [X] T005 [US1] Importar e adicionar `<PwaInstallBanner />` em `app/(app)/layout.tsx` — inserir antes do `<Toaster />` no final do JSX

---

## Phase 4: User Story 2 — Não Interromper a Experiência (Priority: P2)

**Goal**: Verificar que o banner não bloqueia nem sobrepõe o conteúdo principal.

**Independent Test**: Com o banner visível, navegar pelas principais páginas (dashboard, lições, revisão) e confirmar que todo o conteúdo e botões de navegação permanecem acessíveis.

### Implementation for User Story 2

- [X] T006 [US2] Ajustar z-index e espaçamento do banner em `components/pwa-install-banner.tsx` se necessário — MobileNav usa z-[60]; banner usa z-[65] para ficar acima; pb-20 md:pb-4 garante espaço acima da nav mobile

**Checkpoint**: US1 e US2 completos — banner funciona e não interfere com a navegação.

---

## Phase 5: Polish & Quality Gates

- [X] T007 [P] Rodar `npm run lint` — corrigir qualquer erro nos arquivos modificados
- [X] T008 [P] Rodar `npm run test:coverage` — confirmar ≥ 80% coverage (esta feature não adiciona lógica de negócio; cobertura existente não deve cair)
- [X] T009 Rodar `npm run build` — confirmar build de produção sem erros TypeScript
- [X] T010 Rodar `/review` — sem issues críticos (componente simples, puramente client-side)
- [ ] T011 Criar PR (link manual ou `gh pr create` após instalação do CLI)

---

## Dependencies & Execution Order

- **T001**: Setup — começa imediatamente
- **T002–T004**: Implementação do componente — sequencial (mesmo arquivo)
- **T005**: Wiring no layout — depende de T002–T004 (componente precisa existir)
- **T006**: Ajuste de z-index — pode ser feito junto com T002–T004 ou depois
- **T007–T008**: Paralelos — podem rodar juntos após T009
- **T009–T011**: Sequenciais — build → review → PR

### Paralelismo disponível

- T007 (lint) + T008 (test) rodam em paralelo após T005–T006

---

## Parallel Example

```
# Após toda implementação:
Task T007: "npm run lint"
Task T008: "npm run test:coverage"
```

---

## Implementation Strategy

### MVP (Completo em ~30 min)

1. T001: confirmar branch
2. T002–T004: criar `pwa-install-banner.tsx`
3. T005: adicionar ao layout
4. T006: verificar z-index
5. T007–T009: quality gates
6. T010–T011: review + PR

Esta feature não tem MVP parcial — é pequena o suficiente para ser entregue integralmente de uma vez.

---

## Notes

- `BeforeInstallPromptEvent` não existe nas lib padrão do TypeScript — **declarar localmente** no arquivo do componente
- O `beforeinstallprompt` só dispara em Chrome/Edge no desktop e Android; em iOS Safari e Firefox não dispara — o componente simplesmente não exibe nada nesses casos (FR-007 atendido automaticamente)
- O `pb-20` no container do banner (mobile) considera a `MobileNav` que tem `pb-16`; adicionar margem extra garante que o banner não tape a nav
- Nenhum teste unitário é necessário para este componente — a lógica é trivial e depende de APIs do browser que o Vitest não simula
