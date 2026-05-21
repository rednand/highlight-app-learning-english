# Data Model: PWA Install Prompt

**Feature**: 005-pwa-install-prompt
**Date**: 2026-05-21

---

## Nenhuma mudança de schema

Esta feature é puramente client-side. Sem banco de dados, sem Server Actions, sem novas tabelas.

---

## Estado do componente (runtime apenas)

```ts
// Tipo local necessário — não existe nas libs padrão do TypeScript
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Estado interno do PwaInstallBanner
type State = {
  deferredPrompt: BeforeInstallPromptEvent | null  // null = não instalável ou já instalado
  dismissed: boolean                                // true = usuário fechou na sessão atual
}
```

### Ciclo de vida do estado

```
Montagem do componente
  → addEventListener('beforeinstallprompt')
  → addEventListener('appinstalled')

Evento 'beforeinstallprompt' dispara
  → e.preventDefault()
  → setDeferredPrompt(e)           ← banner fica visível

Usuário clica "Instalar"
  → deferredPrompt.prompt()
  → aguarda userChoice
    → se 'accepted':  setDeferredPrompt(null)   ← banner some
    → se 'dismissed': nada (banner volta na próxima sessão)

Usuário clica "Fechar"
  → setDismissed(true)             ← banner some pela sessão

Evento 'appinstalled' dispara
  → setDeferredPrompt(null)        ← banner some permanentemente (app instalado)

Desmontagem
  → removeEventListeners
```

### Condição de visibilidade

```
banner visível quando:
  deferredPrompt !== null
  AND dismissed === false
```

---

## Componente

**`components/pwa-install-banner.tsx`**

```ts
Props: nenhuma
State: { deferredPrompt, dismissed }
Rendered in: app/(app)/layout.tsx
Position: fixed bottom, z-index acima do MobileNav
```
