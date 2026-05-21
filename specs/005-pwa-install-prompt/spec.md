# Feature Specification: PWA Install Prompt

**Feature Branch**: `005-pwa-install-prompt`

**Created**: 2026-05-21

**Status**: Draft

**Input**: User description: "PWA install prompt — exibir banner/notificação para instalar o app Highlight sempre que o usuário acessar pelo navegador (web), enquanto o app não estiver instalado. O banner deve ter um botão 'Instalar' que aciona o prompt nativo do navegador, e um botão para fechar/dispensar o banner naquela sessão."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Banner de Instalação na Primeira Visita e Visitas Subsequentes (Priority: P1)

Um usuário acessa o Highlight pelo navegador de desktop ou celular. Um banner aparece na parte inferior (ou superior) da tela com uma chamada para instalar o app. O banner tem dois botões: "Instalar" e "Fechar". Se o usuário clicar em "Instalar", o navegador exibe o diálogo nativo de instalação do PWA. Se clicar em "Fechar", o banner desaparece para o restante da sessão. Na próxima visita, o banner volta a aparecer — enquanto o app não estiver instalado.

**Why this priority**: Esta é a funcionalidade completa solicitada. O objetivo é aumentar a taxa de instalação do app, garantindo que qualquer usuário que acesse via navegador saiba que pode instalar o Highlight.

**Independent Test**: Acessar o app no navegador (sem estar instalado), verificar que o banner aparece; clicar em "Instalar" e confirmar que o diálogo nativo do navegador é exibido; ou clicar em "Fechar" e confirmar que o banner desaparece pelo resto da sessão; recarregar a página e confirmar que o banner reaparece.

**Acceptance Scenarios**:

1. **Given** o usuário acessa o Highlight via navegador e o app não está instalado, **When** a página carrega, **Then** um banner de instalação é exibido com os botões "Instalar" e "Fechar".
2. **Given** o banner está visível, **When** o usuário clica em "Instalar", **Then** o diálogo nativo de instalação do navegador é aberto.
3. **Given** o banner está visível, **When** o usuário clica em "Fechar", **Then** o banner desaparece e não reaparece durante a mesma sessão de navegação.
4. **Given** o usuário fechou o banner e recarrega a página ou abre uma nova aba, **When** a página carrega novamente, **Then** o banner volta a aparecer (sessão nova = banner reaparece).
5. **Given** o app já está instalado no dispositivo, **When** o usuário acessa pelo navegador, **Then** o banner não é exibido.
6. **Given** o navegador não suporta instalação de PWA (ex: Firefox desktop), **When** o usuário acessa o app, **Then** o banner não é exibido (sem mensagem de erro).

---

### User Story 2 — Não Interromper a Experiência de Uso (Priority: P2)

O banner de instalação não deve bloquear o conteúdo principal, cobrir elementos interativos importantes, nem forçar uma interação antes de o usuário acessar o app. Deve ser um elemento não-intrusivo que o usuário pode ignorar facilmente.

**Why this priority**: Um banner intrusivo prejudica a experiência de uso e pode aumentar a taxa de rejeição. O objetivo é convidar, não forçar.

**Independent Test**: Acessar o app com o banner visível, navegar normalmente pelas páginas, verificar que nenhum botão ou conteúdo principal está bloqueado pelo banner.

**Acceptance Scenarios**:

1. **Given** o banner está visível, **When** o usuário navega pelas páginas do app, **Then** o conteúdo principal permanece visível e acessível sem sobreposição.
2. **Given** o banner está visível, **When** o usuário não interage com ele, **Then** o banner permanece estático — sem animações intrusivas, sons ou pop-ups adicionais.

---

### Edge Cases

- O que acontece se o usuário clicar em "Instalar" mas cancelar o diálogo nativo? O banner deve reaparecer na próxima sessão, como se nada tivesse acontecido.
- O que acontece em navegadores que não disparam o evento de instalação (Firefox, Safari iOS)? O banner simplesmente não aparece — sem erro.
- O que acontece se o usuário já tiver instalado o app mas acessar pelo navegador? O banner não aparece (o navegador não dispara o evento de instalação quando o app já está instalado).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir um banner de instalação sempre que o usuário acessar o app pelo navegador e o app não estiver instalado no dispositivo.
- **FR-002**: O banner DEVE conter um botão de ação primária ("Instalar") que aciona o diálogo nativo de instalação do navegador.
- **FR-003**: O banner DEVE conter um botão secundário ("Fechar" / "Agora não") que dispensa o banner pelo restante da sessão atual.
- **FR-004**: Após dispensado com "Fechar", o banner NÃO DEVE reaparecer na mesma sessão de navegação (até o usuário fechar e reabrir o navegador ou a aba).
- **FR-005**: O banner DEVE reaparecer em novas sessões de navegação, enquanto o app não estiver instalado.
- **FR-006**: O banner NÃO DEVE ser exibido quando o app já estiver instalado no dispositivo.
- **FR-007**: O banner NÃO DEVE ser exibido em navegadores que não suportam instalação de PWA.
- **FR-008**: O banner NÃO DEVE bloquear nem sobrepor o conteúdo principal do app de forma a impedir a navegação.
- **FR-009**: O texto do banner e dos botões DEVE estar em Português Brasileiro (pt-BR).

### Key Entities

- **Banner de Instalação**: Componente UI não-modal exibido na tela enquanto o app não está instalado e o navegador suporta PWA. Contém chamada para ação, botão primário e botão de dispensa.
- **Estado de Dispensa**: Estado transitório de sessão que indica que o usuário fechou o banner na sessão atual. Não persiste entre sessões.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O banner aparece em 100% das sessões de navegação em que o app não está instalado e o navegador suporta PWA.
- **SC-002**: Clicar em "Instalar" resulta na abertura do diálogo nativo do navegador em 100% dos casos onde o navegador suporta instalação.
- **SC-003**: Após clicar em "Fechar", o banner não reaparece na mesma sessão em 100% dos casos.
- **SC-004**: O banner não é exibido quando o app já está instalado, em 100% dos casos.
- **SC-005**: Nenhum elemento do conteúdo principal fica inacessível por causa do banner.

## Assumptions

- O app já atende os critérios de instalabilidade de PWA (possui `manifest.webmanifest`, service worker ativo, HTTPS) — esta feature não muda esses pré-requisitos.
- "Sessão" é definida pelo ciclo de vida da aba/janela do navegador: fechar e reabrir a aba conta como nova sessão.
- O comportamento de re-exibição após "cancelar" o diálogo nativo é idêntico ao comportamento de re-exibição após nova sessão — o banner volta a aparecer.
- O banner é exibido em todas as rotas autenticadas do app (não apenas na home), pois o usuário pode acessar qualquer página diretamente.
- O posicionamento do banner (topo vs. rodapé) é uma decisão de implementação; o requisito é apenas que não bloqueie o conteúdo principal.
- Não há persistência entre sessões do estado "dispensado" — o banner volta sempre. Persistência longa (ex: "não mostrar por 7 dias") está fora do escopo desta especificação.
