# Implementation Plan: PWA Install Prompt

**Branch**: `005-pwa-install-prompt` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-pwa-install-prompt/spec.md`

## Summary

Exibir um banner fixo no rodapé sempre que o usuário acessar o Highlight pelo navegador e o app não estiver instalado. O banner oferece os botões "Instalar" (aciona o diálogo nativo do navegador) e "Fechar" (dispensa pela sessão). Feature puramente client-side: 1 novo componente + 1 linha no layout autenticado. Sem servidor, sem banco de dados.

## Technical Context

**Language/Version**: TypeScript 5 / Next.js 16 App Router

**Primary Dependencies**: React 19, Tailwind v4 (sem novos pacotes)

**Storage**: N/A — estado React puro (sem localStorage, sem DB)

**Testing**: Vitest — lógica trivial; cobertura existente não é afetada

**Target Platform**: Web PWA, mobile e desktop

**Performance Goals**: Zero impacto — listener de evento passivo, nenhum fetch

**Constraints**: Sem novos pacotes; `'use client'` necessário (browser event API)

**Scale/Scope**: 1 novo arquivo + 1 linha modificada

## Constitution Check

| Princípio | Questão | Status |
|-----------|---------|--------|
| I. Code Quality | Sem `any`; `BeforeInstallPromptEvent` declarado localmente; sem `console.log` | ✅ |
| II. Testing | Nenhuma lógica de negócio nova; cobertura de 80% não é afetada | ✅ |
| III. UX Consistency | `'use client'` justificado (browser API `beforeinstallprompt`); pt-BR; mobile-first | ✅ |
| IV. Performance | Listener passivo, sem fetch, sem render blocking | ✅ |
| V. Clean Code | Componente single-purpose; sem abstração prematura | ✅ |
| VI. Simple UX | Banner com 2 botões; não bloqueia conteúdo; reaparece por sessão | ✅ |
| VII. Responsible Design | Sem coleta de dados; opt-in (usuário escolhe instalar) | ✅ |
| VIII. Minimal Deps | Zero novos pacotes — `beforeinstallprompt` é API nativa do browser | ✅ |
| Stack Constraints | Next.js 16 App Router, Tailwind v4 | ✅ |
| Quality Gates | lint → test:coverage → build → /review → PR | ✅ |

## Project Structure

### Documentação

```text
specs/005-pwa-install-prompt/
├── plan.md        ← este arquivo
├── research.md    ← Phase 0 output
├── data-model.md  ← Phase 1 output
└── tasks.md       ← Phase 2 output (/speckit-tasks)
```

### Código

```text
components/
└── pwa-install-banner.tsx     # CREATE — banner de instalação PWA

app/(app)/
└── layout.tsx                 # MODIFY — adicionar <PwaInstallBanner />
```

## Implementação

### Fase 1 — Componente `PwaInstallBanner`

**`components/pwa-install-banner.tsx`**

```tsx
'use client'

// Tipo local necessário:
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
```

Comportamento:
- `useEffect` registra listeners para `beforeinstallprompt` e `appinstalled`
- `beforeinstallprompt` → `e.preventDefault()`, armazena evento em state
- `appinstalled` → limpa o evento (banner desaparece)
- Banner visível quando `deferredPrompt !== null && !dismissed`
- Botão "Instalar" → `deferredPrompt.prompt()` + aguarda `userChoice`; se `accepted` limpa o prompt
- Botão "Fechar" → `setDismissed(true)`
- Posicionamento: `fixed bottom-0 left-0 right-0 z-50`; em mobile fica acima da `MobileNav` (que tem `h-16 pb-safe`)

**Tailwind classes (dark theme consistente com o app):**
- Container: `fixed bottom-0 left-0 right-0 z-50 p-4 pb-20 md:pb-4`
- Card: `max-w-sm mx-auto bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-xl`
- Botão Instalar: `bg-yellow-400 text-black text-sm font-bold px-4 py-2 rounded-full`
- Botão Fechar: `text-xs text-gray-500 hover:text-white`

### Fase 2 — Wiring no Layout

**`app/(app)/layout.tsx`**

Adicionar `import PwaInstallBanner from "../../components/pwa-install-banner"` e `<PwaInstallBanner />` antes do `<Toaster />`.

### Fase 3 — Quality Gates

```bash
npm run lint
npm run test:coverage
npm run build
/review
gh pr create
```

## Complexity Tracking

Nenhuma violação da constituição. Sem entradas necessárias.
