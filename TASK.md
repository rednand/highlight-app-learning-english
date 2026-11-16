# TASK

## Sessão de filme (reabrir o app direto na anotação)
- [x] Util `app/lib/watch-session.ts` (localStorage, expira em 12h)
- [x] Botão "Iniciar sessão / encerrar" na página da aula de filme
- [x] Retomada automática ao abrir o app na home (`components/watch-session-resume.tsx`)
- [x] Encerrar sessão ao excluir a aula
- [ ] Teste manual no celular (PWA)

## Adicionar várias palavras de uma vez
- [x] Server action `addLessonItems` em `app/actions/items.ts`
- [x] Modo "Várias de uma vez" no `add-item-form.tsx`
- [ ] Teste manual

## Capas de livros
- [x] Fallback de capa no `book-picker.tsx` (Open Library: cover_i, olid, ISBN; depois Google Books)
- [ ] Teste manual da busca de livros

## Google Play (TWA)
- [x] Manifest: id, scope, lang, categories
- [x] Manifest: dir, display_override, launch_handler, prefer_related_applications, shortcuts (score PWABuilder)
- [ ] Screenshots no manifest (opcional)
- [x] Rota /.well-known/assetlinks.json (env ANDROID_PACKAGE_NAME e ANDROID_SHA256_FINGERPRINTS)
- [x] Icone maskable com area segura (icon-512.png ja esta dentro da area segura, sem alteracao)
- [x] Politica de privacidade publica em /privacy (env opcional PRIVACY_CONTACT_EMAIL)
- [x] Definir PRIVACY_CONTACT_EMAIL no Vercel
- [x] Exclusao de conta dentro do app: action `deleteAccount`, pagina /account, link na sidebar e no menu Mais
- [x] Pagina publica /account-deletion (URL de exclusao exigida pelo Play Console)
- [x] Teste `__tests__/account-actions.test.ts`
- [x] Pagina publica /about (pagina inicial exigida na verificacao de marca do Google)
- [x] Commit e deploy da /about
- [x] Google Auth Platform: /about como pagina inicial no Branding
- [x] Search Console: propriedade do dominio da Vercel verificada (arquivo public/googlee2b0eb71438259e1.html, nao remover)
- [ ] Google Auth Platform: pedir nova verificacao de marca (Corrigi os problemas) a partir de 13/11/2026
- [x] Pagina /account com dados do login Google (nome, e-mail, foto, provedor, datas) e botao de notificacoes
- [x] generatePracticeText exige login e limita o tamanho dos campos
- [ ] Conferir /account no celular depois do deploy (dados do login e botao de notificacoes)
- [ ] Teste manual da exclusao de conta com um usuario descartavel
- [x] Corrigir teste pre-existente translate-actions (mock do MyMemory sem responseStatus)
- [x] Gerar .aab no PWABuilder e configurar as envs no Vercel (assetlinks.json ok)
- [ ] Adicionar SHA-256 da chave de assinatura do Play em ANDROID_SHA256_FINGERPRINTS
- [ ] Conta Play Console e teste fechado

## Foco em mídia
- [x] Navegação: Mídia antes de Aulas; Gramática e Trilha no "Mais"
- [x] Home: atalhos para adicionar filme/série, música e livro; contador de mídias; mídias recentes na coluna principal
- [x] Textos: descrição do app, manifest, login e política de privacidade
- [ ] Teste manual da nova home e navegação (celular e desktop)
- [ ] Atualizar descrição da ficha na Play Console

## Aprendizado com mídia: letra, frase da cena e revisão por mídia
- [x] Letra automática: action `fetchLyrics` (LRCLIB) e botão "Buscar letra automaticamente" nas músicas
- [x] Frase da cena: extração guarda a frase onde cada palavra apareceu em `context`
- [x] Revisão mostra a frase ("Na cena", "Na música", "No livro") com a palavra destacada
- [x] Placeholder do campo de contexto por tipo de mídia
- [x] Revisar por mídia: botão na página da mídia abre `/review?lesson=<id>`; sem pendentes, revisa todas as palavras
- [x] Testes: `extract-words.test.ts`, `lyrics-actions.test.ts`
- [ ] Teste manual: buscar letra de uma música real em produção (LRCLIB)
- [ ] Teste manual: revisão por mídia e frase da cena no celular
- [x] Correções do review: modo treino sem alterar agenda quando nada está pendente, erro na revisão volta ao filtro, destaque só de palavra inteira, timeout e fallback no LRCLIB, nomes de artista com vírgula
- [x] Home: grade "Adicionar" com ícones maiores (Filme, Música, Livro, Aula), contadores em cartões, mídias recentes com capas grandes
- [ ] Teste manual da nova home no celular

## Ícone da notificação
- [x] Badge monocromático (`public/badge-96.png`, branco com transparência) no lugar do ícone colorido, que aparecia como quadrado na barra de status do Android
- [ ] Teste manual: receber uma notificação no celular depois do deploy

## Logo maior na home
- [x] Logo da home no celular de 28px para 40px de altura
- [x] Saudação ao lado direito do logo ("Olá 👋" + nome em duas linhas, cabe em telas de 320px)

## Descartar palavras da revisão
- [x] Coluna `flashcards.discarded_at` (seção 15 de `supabase/migration.sql`)
- [x] Rodar a migração no SQL Editor do Supabase ANTES do deploy
- [x] Botão "Já sei, descartar" na revisão, com "Desfazer"
- [x] Botão de olho em cada palavra da página da mídia para tirar ou voltar para a revisão; selo "Fora da revisão"
- [x] Descartadas saem da revisão, dos contadores da home e da notificação diária
- [x] Corrigido: "Pular" parava de funcionar depois da primeira resposta
- [ ] Teste manual no celular

## Página de palavras
- [x] Nova página `/words` com todas as palavras: busca, filtros (Todas / Na revisão / Fora da revisão) e botão de olho para tirar ou voltar para a revisão
- [x] "Ver todas" de "Últimas palavras" na home leva para `/words`; "Palavras" no menu Mais e na sidebar
- [ ] Teste manual no celular

## Palavras que aparecem toda hora na revisão
- [x] Alternativas erradas variam ao longo da sessão (as menos usadas têm preferência) e não incluem palavras descartadas
- [x] Erro em palavra madura (intervalo de 6 dias ou mais) corta o intervalo pela metade em vez de voltar para 1 dia
- [x] Página Palavras marca "Repetida N×" e tem o filtro "Repetidas"
- [ ] Teste manual da revisão no celular

## Logo e ícone novos
- [x] Logo "high" + "light" marcado com marca-texto (`public/highlight-logo.svg`, versão para fundo claro em `highlight-logo-light.svg`)
- [x] Ícone: "h" branco com passada de marca-texto na diagonal (icon-192/512, highlight-icon, app/icon, app/apple-icon)
- [x] Badge das notificações com o mesmo "h"
- [ ] Gerar de novo o `.aab` no PWABuilder para o ícone novo ir para o app Android
- [x] Faixa do ícone com cara de marca-texto (12°, bordas irregulares, listras); ícones do manifest com nome novo (icon-*-v3.png) para o Chrome atualizar o ícone do app instalado
- [ ] Conferir o ícone na tela inicial do celular (remover os dois apps e instalar de novo pelo Chrome)

## Paleta de cores
- [x] Paleta única no `@theme` (fundos, borda, 4 cinzas de texto, amarelo principal e de destaque)
- [x] Hex soltos e `gray-*`/`yellow-*` trocados pela paleta em todo o app
- [x] Textos com contraste >= 4,5:1 (antes `gray-600` tinha 2,6:1); 4 níveis de texto + `fg-faint` para ícones decorativos
- [x] Atalhos da home com ícone amarelo sobre fundo escuro
- [x] Botões amarelos com texto branco corrigidos para texto preto
- [x] Regra da paleta em `.claude/rules/stack.md`
- [ ] Conferir as telas no celular

## Anotações na aula
- [x] Tabela `lesson_notes` (seção 16 de `supabase/migration.sql`), movendo a nota atual de cada aula para a lista
- [x] Rodar a migração no SQL Editor do Supabase ANTES do deploy
- [x] Seção "Anotações" acima de "Palavras & Expressões": adicionar, editar e apagar cada anotação, com data e hora
- [x] Nota digitada ao criar aula/mídia vira a primeira anotação; "Editar" não mexe mais nas notas
- [x] Lista de aulas mostra a primeira anotação como resumo
- [ ] Teste manual no celular

## Ícone da lâmpada
- [x] Ícone novo (R3, minimalista): contorno amarelo da lâmpada com o filamento em forma de "h" branco; cabe no círculo do Android
- [x] Badge das notificações: silhueta da lâmpada com o "h"
- [x] Manifest aponta para icon-*-v4.png
- [ ] Gerar de novo o `.aab` no PWABuilder (mesmo `signing.keystore`)

## Google / Search Console
- [x] `robots.txt` bloqueando só rotas técnicas (as telas internas têm noindex e redirecionam para o login); deploys de preview bloqueados por inteiro
- [x] `sitemap.xml` com as páginas públicas
- [x] Endereço canônico em cada página pública (`metadataBase` + `alternates.canonical`) e `noindex` nas telas internas
- [ ] Recuperar o acesso ao Search Console (verificar a propriedade com a conta certa) e enviar o sitemap
- [ ] Pedir nova validação do erro "Cópia sem página canônica" no Search Console

## Cores nas anotações
- [x] Barra de cores no editor (marca-texto, verde, azul, rosa, vermelho e borracha): selecionar um trecho e tocar na cor
- [x] Marcação curta no texto (`[verde]…[/verde]`), sem HTML; prévia colorida enquanto edita
- [x] Anotações salvas mostram só as cores; resumo da lista de aulas sem marcação
- [ ] Teste manual no celular (selecionar e pintar)
