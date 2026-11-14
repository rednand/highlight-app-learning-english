# Stack — versões e convenções

- Next.js 16.x: use apenas App Router. Nunca crie pasta `pages/`.
- React 19: prefira `use()` para dados assíncronos. Evite padrões `useEffect` + fetch para dados iniciais.
- Tailwind v4: configuração CSS-first com `@theme`. Não crie `tailwind.config.js`.
- TypeScript: proibido usar `any`. Use tipos corretos ou `unknown` com type guard.
- Sem `console.log` em código commitado.
- Cores: use só a paleta do `@theme` em `app/globals.css` (`bg-page`, `bg-surface`, `bg-raised`, `border-line`, `text-fg-soft/muted/subtle/faint`, `bg-brand`, `text-brand`…). Não use hex soltos (`bg-[#151515]`) nem `gray-*`/`yellow-*` do Tailwind. `text-fg-faint` é só para ícones decorativos e placeholders.
