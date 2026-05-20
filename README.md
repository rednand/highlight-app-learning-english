# Highlight

**Transforme suas aulas de inglês em vocabulário que você realmente aprende.**

Highlight é um PWA para estudantes de inglês anotarem vocabulário de aulas, filmes, músicas e livros — e revisarem com flashcards inteligentes usando o algoritmo SM-2.

## Por que Highlight?

A maioria dos estudantes anota vocabulário e nunca revisa. Highlight resolve isso combinando anotação rápida com revisão espaçada (SM-2) — o mesmo algoritmo do Anki, direto no browser, instalável no celular.

---

## Funcionalidades

### Vocabulário por fonte

Crie lições vinculadas ao contexto onde você ouviu a palavra:

| Tipo | Detalhes |
|------|---------|
| **Aula** | Título livre e data |
| **Filme / Série** | Busca automática via TMDB, pôster e número de temporada |
| **Música** | Artista e thumbnail |
| **Livro** | Autor e capa |

Para cada palavra ou expressão adicionada, o sistema busca automaticamente:
- Fonética IPA (Dictionary API)
- Frase de exemplo (Dictionary API → fallback Tatoeba)
- Tradução sugerida (MyMemory EN→PT)

Você também pode colar um trecho de texto e usar o **Extrator de Transcrição** para sugerir palavras incomuns em massa.

### Revisão com SM-2

Flashcards agendados pelo algoritmo SM-2. A cada revisão, você avalia:

| Botão | Tecla | Efeito |
|-------|-------|--------|
| Não lembro | `1` | Reinicia o intervalo para 1 dia |
| Quase | `2` | Avança com fator de facilidade reduzido |
| Fácil | `3` | Avança com salto maior de intervalo |

`Espaço` vira o cartão. Filtros: por aula específica, e tabs Todas / Urgentes / Concluídas.

### Modo Cinema

Revisão especial para vocabulário de filmes e músicas: em vez da tradução, o cartão exibe o pôster ou thumbnail como resposta — ajuda a ancorar a palavra no contexto visual onde você a ouviu.

### Streak

O app registra seus dias consecutivos de revisão. O streak incrementa se você revisar no dia seguinte, e reseta se pular um dia. Exibido na barra lateral (desktop) e na tela de revisão.

### Gramática

Referência de 31 tópicos gramaticais organizados de A1 a C2:

- Estrutura da regra, exemplos, notas de uso
- Quiz de 5 questões por tópico (múltipla escolha com feedback imediato)
- Melhor pontuação salva por usuário e por regra
- Categorias: Tempos Verbais, Condicionais, Voz Passiva, Modais, Artigos, Preposições, Phrasal Verbs, e mais

### Trilha de aprendizado (Roadmap)

Currículo estruturado em três níveis: **Basic → Intermediate → Advanced**. Cada nível tem temas com sessões. Você marca sessões concluídas e pode vincular qualquer sessão a uma aula existente.

### Notificações push

Opt-in de notificações no browser. Um cron job roda todo dia ao meio-dia UTC e envia um lembrete para usuários com flashcards vencidos.

### Dashboard

Visão geral do progresso: aulas registradas, palavras totais, cartões para revisar hoje, meta diária de vocabulário, últimas aulas e mídia recente.

---

## Atalhos de teclado

| Atalho | Ação |
|--------|------|
| `Espaço` | Virar o flashcard |
| `1` | Não lembro |
| `2` | Quase |
| `3` | Fácil |

---

## Comandos

```bash
npm run dev              # Dev server (localhost:3000)
npm run build            # Build de produção
npm run lint             # ESLint (obrigatório antes de PR)
npm run test:coverage    # Vitest com relatório de cobertura (≥ 80%)
```

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind v4 |
| Banco | Supabase (PostgreSQL + Auth) |
| Auth | Google OAuth via Supabase |
| Hosting | Vercel (cron via Vercel Cron) |
| Testes | Vitest 2.x + Testing Library |
| CI | GitHub Actions |
| Notificações | Web Push API + VAPID |
| Pronúncia | Web Speech API (TTS + reconhecimento) |

---

## APIs externas

| API | Uso |
|-----|-----|
| TMDB | Busca de filmes/séries + pôster (cache 1h) |
| Dictionary API | Fonética IPA + exemplos |
| Tatoeba | Frases de exemplo — fallback |
| MyMemory | Tradução EN→PT |
| Google OAuth | Autenticação |

---

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Dashboard |
| `/lessons` | Lista de aulas |
| `/lessons/new` | Nova aula |
| `/lessons/[id]` | Detalhe + vocabulário |
| `/media` | Hub de mídia |
| `/movies` · `/movies/new` | Filmes e séries |
| `/music` · `/music/new` | Músicas |
| `/books` · `/books/new` | Livros |
| `/review` | Revisão de flashcards (SM-2 + Modo Cinema) |
| `/grammar` | Referência gramatical |
| `/grammar/[slug]` | Detalhe da regra |
| `/grammar/quiz` | Lista de quizzes |
| `/grammar/quiz/[slug]` | Quiz interativo |
| `/roadmap` | Trilha de aprendizado |

---

© Highlight
