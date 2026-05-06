# Highlight

App para estudantes de inglês anotarem vocabulário de aulas, revisarem com flashcards e acompanharem seu progresso em uma trilha de aprendizado.

## Funcionalidades

- **Aulas** — registre aulas com título, data, notas e associação ao roadmap
- **Vocabulário** — adicione palavras, expressões e frases com tradução, exemplo de uso, fonética (IPA) e sua própria frase
- **Tradução automática** — sugestão via MyMemory API (sem chave)
- **Exemplo de uso** — busca automática na Free Dictionary API e Tatoeba
- **Fonética (IPA)** — buscada automaticamente da Free Dictionary API
- **Gravador de voz** — fale a palavra em inglês para preencher o campo (Web Speech API)
- **Áudio** — ouça a pronúncia de qualquer palavra com um clique (Web Speech API)
- **Extração de transcript** — cole um texto em inglês e o app extrai o vocabulário incomum com tradução automática
- **Flashcards SM-2** — revisão espaçada com algoritmo SM-2, filtro por aula
- **Trilha de aprendizado** — roadmap Basic / Intermediate / Advanced com progresso por sessão
- **PWA** — instalável como app no celular via browser

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions)
- [Supabase](https://supabase.com) (Auth, PostgreSQL, RLS)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Sonner](https://sonner.emilkowal.ski) (toasts)

## Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/rednand/english-notes-saas.git
cd english-notes-saas
npm install
```

### 2. Variáveis de ambiente

Crie um arquivo `.env.local` na raiz:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
```

### 3. Banco de dados

No **Supabase → SQL Editor**, execute o conteúdo de `supabase/migration.sql`.

O projeto assume que você já tem as tabelas `lessons`, `flashcards` e `auth.users` criadas. A migration adiciona as colunas e tabelas necessárias.

### 4. Autenticação

No **Supabase → Authentication → URL Configuration**:

- **Site URL**: URL de produção (ex: `https://seu-app.vercel.app`)
- **Redirect URLs**: adicione `https://seu-app.vercel.app/**` e `http://localhost:3000/**`

### 5. Rodar localmente

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Deploy

O projeto está configurado para deploy na [Vercel](https://vercel.com). Adicione as variáveis de ambiente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` nas configurações do projeto.
