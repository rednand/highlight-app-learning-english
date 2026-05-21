# Research: PWA Install Prompt

**Feature**: 005-pwa-install-prompt
**Date**: 2026-05-21

---

## Decision 1: Onde adicionar o banner no layout

**Decision**: Adicionar `<PwaInstallBanner />` no `app/(app)/layout.tsx` (layout das rotas autenticadas).

**Rationale**: O app Highlight é usado exclusivamente por usuários autenticados. O banner de instalação é relevante para quem já usa o app e ainda não o instalou. Adicionar ao root layout (`app/layout.tsx`) exibiria o banner também na página de login, que é desnecessário. O `(app)/layout.tsx` já envolve todas as páginas funcionais (dashboard, lições, revisão, etc.).

**Alternatives considered**:
- Root layout: descartado — exibiria banner na tela de login.
- Por rota específica: descartado — a spec diz "sempre que acessar", sem restrição de rota.

---

## Decision 2: Mecanismo de captura do evento `beforeinstallprompt`

**Decision**: Client Component com `useEffect` que escuta `beforeinstallprompt` e armazena o evento em state. O estado é limpo ao ouvir o evento `appinstalled`.

**Rationale**: O evento `beforeinstallprompt` só existe no browser (não dispara no servidor). O padrão estabelecido pelo MDN e pela comunidade PWA é: (1) `e.preventDefault()` para suprimir o prompt automático do navegador, (2) armazenar o evento para uso posterior, (3) chamar `event.prompt()` quando o usuário clicar em "Instalar".

**TypeScript note**: `BeforeInstallPromptEvent` não existe nas `lib` padrão do TypeScript — precisa ser declarado localmente com `interface BeforeInstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }`.

---

## Decision 3: Estado "dispensado" (Fechar)

**Decision**: Estado React simples (`dismissed: boolean`) no componente — sem `localStorage` ou `sessionStorage`.

**Rationale**: A spec define "sessão" como o ciclo de vida da aba/janela. Estado React satisfaz exatamente esse requisito: persiste enquanto o componente está montado (sessão ativa), zera ao fechar/reabrir a aba. Não há necessidade de persistência entre sessões — o banner deve voltar sempre.

**Alternatives considered**:
- `sessionStorage`: funcionaria, mas é mais complexo e desnecessário para o requisito definido.
- `localStorage` com TTL: descartado — a spec explicitamente deixa "não mostrar por X dias" fora do escopo.

---

## Decision 4: Ação pós-clique em "Instalar"

**Decision**: Após `deferredPrompt.prompt()`, aguardar `deferredPrompt.userChoice`. Se `outcome === 'accepted'`, limpar o `deferredPrompt` (banner some). Se `outcome === 'dismissed'`, manter o `deferredPrompt` (banner volta em nova sessão).

**Rationale**: O banner não deve ser escondido se o usuário cancelou o diálogo nativo — apenas quando ele realmente instalou. Esta é a UX recomendada pelo Google para PWAs.

---

## Decision 5: Posicionamento do banner

**Decision**: Banner fixo no rodapé da tela (`position: fixed; bottom: 0`), acima da navegação mobile (que usa `pb-16 md:pb-0` no `main`).

**Rationale**: O `(app)/layout.tsx` já usa `pb-16` para acomodar o `MobileNav` no mobile. O banner no rodapé é o padrão mais comum para install prompts (ex: Twitter PWA, Spotify PWA) e não interfere com a navegação lateral do desktop.

**Note**: Em mobile, o banner precisa ficar acima da `MobileNav` — usar `z-index` adequado e considerar o espaçamento.

---

## Arquivo a criar

| Arquivo | Ação |
|---------|------|
| `components/pwa-install-banner.tsx` | CREATE — Client Component com banner de instalação |
| `app/(app)/layout.tsx` | MODIFY — importar e renderizar `<PwaInstallBanner />` |
