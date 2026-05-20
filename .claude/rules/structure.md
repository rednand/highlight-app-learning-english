# Estrutura de arquivos

- UI de rotas: `app/(app)/`
- Componentes reutilizáveis: `components/` (nunca dentro de `app/`)
- Server Actions agrupadas por domínio: `app/actions/` (ex: `checklists.ts`, `auth.ts`)
- Server Components são o padrão. Adicione `'use client'` só quando precisar de APIs do browser ou event handlers.
- Sem estilos inline — use classes Tailwind.
