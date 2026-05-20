# Highlight — Product Spec

## Visão geral

**Highlight** é um PWA para aprendizado de inglês baseado em revisão espaçada. O usuário registra vocabulário a partir de aulas, filmes, séries, músicas e livros. Cada palavra vira um flashcard revisado pelo algoritmo SM-2. O app também oferece referência de gramática com quizzes e um roadmap estruturado de estudos.

Público-alvo: adultos brasileiros aprendendo inglês de forma autodidata.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind v4 |
| Banco | Supabase (PostgreSQL + Auth) |
| Auth | Google OAuth via Supabase |
| Hosting | Vercel (cron via Vercel Cron) |
| Notificações | Web Push API + VAPID |

---

## Modelo de dados

```
auth.users
  └── lessons            (source_type: lesson | movie | music | book)
        └── lesson_items (type: word | expression | phrase)
              └── flashcards (SM-2: ease_factor, interval_days, next_review_at)

  └── user_streaks       (days, last_review_date)
  └── grammar_progress   (rule_slug, correct, total)
  └── roadmap_progress   (session_key)
  └── push_subscriptions (endpoint, p256dh, auth)
```

### Tabelas

**`lessons`**
Agrupa vocabulário por contexto. Pode ser uma aula comum, um filme/série (via TMDB), uma música ou um livro.

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK auth.users |
| title | text | |
| source_type | text | `lesson \| movie \| music \| book` |
| lesson_date | date | |
| notes | text | |
| roadmap_key | text | formato `"Level\|\|Tema\|\|Sessão"` |
| tmdb_id | int | filmes/séries |
| tmdb_type | text | `movie \| tv` |
| tmdb_poster_path | text | |
| tmdb_season | int | séries |
| music_artist | text | |
| music_thumbnail_url | text | |
| book_author | text | |
| book_cover_url | text | |

**`lesson_items`**
Uma palavra, expressão ou frase anotada em uma aula.

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| lesson_id | uuid | FK lessons |
| user_id | uuid | FK auth.users |
| term | text | frente do flashcard |
| translation | text | verso do flashcard |
| type | text | `word \| expression \| phrase` |
| context | text | frase de contexto original |
| phonetic | text | IPA via Dictionary API |
| my_sentence | text | frase criada pelo usuário |

**`flashcards`**
Estado SM-2 de cada lesson_item.

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK auth.users |
| lesson_item_id | uuid | FK lesson_items (SET NULL on delete) |
| front | text | copiado do term |
| back | text | copiado do translation |
| ease_factor | float | padrão 2.5 |
| interval_days | int | padrão 1 |
| next_review_at | timestamptz | padrão NOW() |

**`user_streaks`** — dias consecutivos de revisão  
**`grammar_progress`** — melhor resultado por quiz de gramática  
**`roadmap_progress`** — sessões da trilha concluídas  
**`push_subscriptions`** — inscrições Web Push por usuário

Todas as tabelas têm RLS: usuário acessa apenas suas próprias linhas.

---

## Funcionalidades

### 1. Aulas e vocabulário

O usuário cria uma aula e adiciona itens (palavras, expressões, frases). Ao salvar um item, o sistema automaticamente cria um flashcard com estado SM-2 inicial.

Ao criar a aula o usuário pode associá-la a:
- **Aula comum** — título livre
- **Filme/Série** — busca via TMDB, armazena pôster e temporada
- **Música** — busca com artista e thumbnail
- **Livro** — título, autor e capa

Para cada item, o sistema pode buscar automaticamente:
- Fonética IPA (Dictionary API)
- Frase de exemplo (Dictionary API → fallback Tatoeba)

O usuário também pode colar um trecho de texto e usar o **Transcript Extractor** para sugerir palavras incomuns em massa.

---

### 2. Revisão com SM-2

O algoritmo SM-2 agenda cada flashcard com base na nota dada pelo usuário.

**Notas disponíveis:**

| Botão | Grade | Efeito |
|---|---|---|
| Não lembro | 1 | interval_days = 1 |
| Quase | 3 | interval_days × ease_factor |
| Fácil | 5 | interval_days × ease_factor (maior salto) |

```
ease_factor = max(1.3, ef + 0.1 - (5 - grade) × (0.08 + (5 - grade) × 0.02))
interval: grade < 3 → 1 dia | interval == 1 → 6 dias | senão → round(interval × ef)
```

**Filtros da revisão:**
- Todas as aulas / aula específica
- Tabs: Todas / Urgentes (due > 0) / Concluídas (due = 0)
- **Modo Cinema**: somente palavras de filmes e músicas, mostra pôster/thumbnail como resposta

**Atalhos de teclado:** `Space` vira o cartão, `1/2/3` atribui a nota.

---

### 3. Streak

Ao completar uma sessão de revisão, o sistema atualiza `user_streaks`:
- Mesmo dia → não altera
- Dia seguinte → incrementa `days`
- Intervalo maior → reseta para 1

Exibido na sidebar (desktop) e no painel de stats da revisão.

---

### 4. Gramática

Referência estática carregada de `data/grammar-rules.json` (31 tópicos, níveis A1–C2).

Cada regra tem: título, estrutura, exemplos, notas de uso e link para o quiz.

**Quiz:** múltipla escolha com 5 questões. Ao responder errado, exibe dica. Resultado salvo em `grammar_progress` (melhor pontuação por regra).

Categorias: Tempos Verbais, Condicionais, Voz Passiva, Discurso Indireto, Verbos Modais, Artigos, Preposições, Gerúndio & Infinitivo, Orações Relativas, e mais.

---

### 5. Trilha (Roadmap)

Currículo estruturado em três níveis: **Basic → Intermediate → Advanced**.

Cada nível tem temas com sessões. O usuário marca sessões concluídas (salvo em `roadmap_progress`). Sessões podem ser vinculadas a aulas via `roadmap_key` (`"Level||Tema||Sessão"`).

---

### 6. Push notifications

O usuário pode ativar notificações (opt-in via `PushToggle`). Um cron job roda ao meio-dia UTC (`/api/cron/push-review`) e envia um lembrete a todos os usuários com cartões devidos.

---

## Fluxos principais

### Adicionar vocabulário de um filme
1. `/movies/new` → busca no TMDB → seleciona título/temporada → salva lesson
2. `/lessons/[id]` → adiciona palavras → sistema busca fonética automaticamente
3. Flashcards criados, agendados para revisão imediata

### Sessão de revisão diária
1. `/review` → ver cartões devidos → "Revisão Rápida"
2. Flashcard exibe o termo em inglês + fonética
3. Usuário pensa na resposta → clica "Ver resposta"
4. Avalia com 1/3/5 → próximo cartão
5. Ao terminar: streak atualizado, resultado exibido

### Quiz de gramática
1. `/grammar` → seleciona tópico → "Fazer Quiz"
2. 5 questões de múltipla escolha
3. Resposta errada exibe dica imediata
4. Resultado final salvo; melhor pontuação exibida em futuras visitas

---

## APIs externas

| API | Uso | Cache |
|---|---|---|
| TMDB | Busca de filmes/séries + pôster | 1h (revalidate: 3600) |
| Dictionary API | Fonética IPA + exemplo | sem cache |
| Tatoeba | Frases de exemplo (fallback) | 24h (revalidate: 86400) |
| Google OAuth | Autenticação | — |
| Web Push | Notificações browser | — |
| Web Speech API | Text-to-speech (pronúncia) | — |

---

## Rotas

| Rota | Descrição |
|---|---|
| `/` | Dashboard |
| `/lessons` | Lista de aulas |
| `/lessons/new` | Nova aula |
| `/lessons/[id]` | Detalhe + vocabulário |
| `/movies` | Lista de filmes/séries |
| `/movies/new` | Adicionar filme/série |
| `/music` | Lista de músicas |
| `/music/new` | Adicionar música |
| `/books` | Lista de livros |
| `/books/new` | Adicionar livro |
| `/media` | Hub de mídia (todos os tipos) |
| `/review` | Revisão de flashcards |
| `/grammar` | Referência de gramática |
| `/grammar/[slug]` | Detalhe da regra |
| `/grammar/quiz` | Lista de quizzes |
| `/grammar/quiz/[slug]` | Quiz interativo |
| `/roadmap` | Trilha de aprendizado |
| `/login` | Autenticação Google |
| `/auth/callback` | Callback OAuth |
| `/api/cron/push-review` | Cron de notificações |

---

## Convenções de código

- Server Components por padrão — `'use client'` apenas quando necessário
- Mutations exclusivamente via Server Actions em `app/actions/` (agrupadas por domínio)
- Client Components nunca acessam Supabase diretamente
- Admin client (`supabase/admin.ts`) somente em rotas server-side
- Sem `tailwind.config.js` — configuração CSS-first com `@theme`
- Sem `console.log` em código commitado
- TypeScript: proibido `any`
