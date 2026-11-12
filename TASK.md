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
- [ ] Teste manual da exclusao de conta com um usuario descartavel
- [x] Corrigir teste pre-existente translate-actions (mock do MyMemory sem responseStatus)
- [ ] Gerar .aab no PWABuilder e configurar as envs no Vercel
- [ ] Conta Play Console e teste fechado

## Foco em mídia
- [x] Navegação: Mídia antes de Aulas; Gramática e Trilha no "Mais"
- [x] Home: atalhos para adicionar filme/série, música e livro; contador de mídias; mídias recentes na coluna principal
- [x] Textos: descrição do app, manifest, login e política de privacidade
- [ ] Teste manual da nova home e navegação (celular e desktop)
- [ ] Atualizar descrição da ficha na Play Console
