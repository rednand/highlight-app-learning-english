# Next.js middleware/proxy migration

- A partir da versão recente, Next.js usa proxy.ts no lugar de middleware.ts para middlewares globais.
- O arquivo proxy.ts deve exportar a função proxy (não middleware).
- O config.matcher segue igual.
