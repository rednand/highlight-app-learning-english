# Feature Specification: Responsiveness Audit & Fixes

**Feature Branch**: `002-responsive-audit`

**Created**: 2026-05-20

**Status**: Draft

**Input**: User description: "avalie se meu projeto esta 100% responsivo"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Auditar todas as telas em mobile (Priority: P1)

Como desenvolvedor, quero revisar cada tela do app no viewport mobile (≤ 375px de largura)
e identificar todos os elementos que transbordam, ficam cortados, ou ficam inacessíveis
por toque, para ter um mapa completo dos problemas existentes.

**Why this priority**: Sem o mapa de problemas não é possível corrigir nada. A auditoria é o
pré-requisito de todas as outras histórias.

**Independent Test**: Abre cada rota listada em um dispositivo de 375px (ou DevTools em modo
mobile) e verifica que nenhum elemento extrapola os limites da tela horizontalmente.

**Acceptance Scenarios**:

1. **Given** o app aberto em viewport 375px, **When** o usuário navega para o Dashboard `/`,
   **Then** todos os cards, stats e listas são exibidos dentro da área visível sem scroll horizontal.
2. **Given** o app aberto em viewport 375px, **When** o usuário acessa a tela de revisão `/review`,
   **Then** os controles de grade (Não lembro / Quase / Fácil) são exibidos empilhados e
   tocáveis com área mínima de 44×44px.
3. **Given** o app aberto em viewport 375px, **When** o usuário acessa qualquer formulário
   (nova aula, novo item), **Then** todos os campos e botões estão visíveis e utilizáveis
   sem zoom manual.

---

### User Story 2 - Corrigir problemas identificados na auditoria (Priority: P2)

Como desenvolvedor, quero corrigir cada problema de responsividade identificado na auditoria,
priorizando as telas com mais uso (Dashboard, Revisão, Lições), para que o app funcione
corretamente como PWA no celular.

**Why this priority**: A auditoria sem correção não entrega valor. Correções devem seguir
a ordem de impacto: telas de alta frequência antes de telas secundárias.

**Independent Test**: Para cada tela corrigida, verificar em 375px, 390px (iPhone 14) e
428px (iPhone 14 Plus) que o layout renderiza corretamente e que não há scroll horizontal.

**Acceptance Scenarios**:

1. **Given** uma correção aplicada em uma tela, **When** testada em viewport 375px e 428px,
   **Then** o layout adapta corretamente em ambos os tamanhos sem overflow.
2. **Given** um botão de ação primária corrigido, **When** testado com toque em dispositivo real,
   **Then** o botão tem área de toque ≥ 44×44px e responde ao primeiro toque.
3. **Given** uma tabela ou grade corrigida, **When** vista em mobile, **Then** a grade
   adapta para coluna única ou apresenta scroll horizontal controlado com indicador visual.

---

### User Story 3 - Validar responsividade em tablet (Priority: P3)

Como desenvolvedor, quero verificar que o layout intermediário (768px–1024px / tablet)
também funciona corretamente, pois o breakpoint `md:` é o ponto de transição entre a
navegação mobile e desktop.

**Why this priority**: O breakpoint md (768px) é crítico — abaixo dele a navegação lateral
some e o MobileNav aparece. Problemas nessa faixa afetam tablets e navegadores redimensionados.

**Independent Test**: Abre o app em 768px e 1024px de largura e confirma que a sidebar
aparece, o MobileNav some, e o conteúdo principal não tem overflow horizontal.

**Acceptance Scenarios**:

1. **Given** o app em 768px, **When** o usuário navega entre páginas, **Then** a sidebar
   lateral está visível e o MobileNav não aparece.
2. **Given** o app entre 768px e 1024px, **When** o usuário acessa a tela de revisão,
   **Then** os flashcards e controles são exibidos com espaçamento adequado sem overflow.
3. **Given** o app em 1024px, **When** o usuário acessa listas longas (aulas, gramática),
   **Then** as listas usam o espaço disponível sem colunas vazias desnecessárias.

---

### Edge Cases

- Telas com tabelas de dados (se existirem): devem ter scroll horizontal contido ou layout alternativo em mobile.
- Imagens de pôster TMDB e thumbnails de música: devem ter dimensões máximas definidas para não causar overflow em mobile.
- Textos longos (títulos de aulas, nomes de filmes): devem truncar com ellipsis e não quebrar o layout.
- Formulários com muitos campos (adicionar item de aula): devem ser usáveis em mobile sem precisar de zoom.
- O modo Cinema no /review exibe pôster em tamanho grande: deve caber dentro do viewport mobile.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Todas as 17 rotas do app DEVEM renderizar sem scroll horizontal em viewport de 375px.
- **FR-002**: Todos os elementos interativos (botões, links, inputs) DEVEM ter área tocável mínima de 44×44px em mobile.
- **FR-003**: Textos que excedem a largura do container DEVEM truncar com ellipsis ou quebrar linha — nunca causar overflow horizontal.
- **FR-004**: Imagens de mídia (pôsteres, thumbnails) DEVEM ter largura máxima definida e não ultrapassar os limites do container em mobile.
- **FR-005**: O breakpoint de transição entre navegação mobile e desktop (md: 768px) DEVE funcionar corretamente: sidebar visível acima de 768px, MobileNav visível abaixo de 768px.
- **FR-006**: Formulários de criação e edição DEVEM ser completamente utilizáveis em 375px sem necessidade de zoom manual.
- **FR-007**: O modo Cinema no `/review` DEVE exibir pôster e controles dentro do viewport 375px sem overflow.
- **FR-008**: Cada problema identificado na auditoria DEVE ser documentado com: nome da tela, elemento problemático, viewport afetado, e correção aplicada.

### Key Entities

- **Viewport**: Largura da janela do navegador usada como referência de teste (375px mobile, 768px tablet, 1280px desktop).
- **Overflow horizontal**: Condição em que o conteúdo extrapola a largura do viewport, causando barra de scroll horizontal indesejada.
- **Área de toque**: Região clicável/tocável de um elemento interativo. Mínimo recomendado: 44×44px.
- **Breakpoint md**: Ponto de transição do Tailwind em 768px que separa os layouts mobile e desktop no app.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das 17 rotas passam no teste de overflow horizontal em 375px (zero scroll horizontal).
- **SC-002**: 100% dos elementos interativos primários (botões de ação, links de navegação) têm área de toque ≥ 44×44px.
- **SC-003**: O app é utilizável em 375px, 768px e 1280px sem nenhum elemento cortado ou inacessível.
- **SC-004**: A transição de layout no breakpoint 768px (sidebar ↔ MobileNav) funciona corretamente em 100% das telas auditadas.
- **SC-005**: Todos os problemas identificados na auditoria são documentados e cada um tem status "corrigido" ou "adiado com justificativa" antes do merge.

## Assumptions

- O app já tem estrutura responsiva básica: sidebar `hidden md:flex`, MobileNav para mobile, e `pb-16 md:pb-0` no conteúdo principal. A auditoria verificará se a execução em cada tela está correta, não a arquitetura geral.
- Testes serão feitos via DevTools do browser (Chrome/Firefox) em modo de dispositivo simulado, não em dispositivos físicos.
- O breakpoint mobile-first é 375px (iPhone SE / menor iPhone comum). Acima disso, problemas são de menor prioridade.
- Acessibilidade (contraste, leitores de tela) está fora do escopo desta auditoria — apenas responsividade visual e de interação.
- O audit cobre apenas as rotas autenticadas (`/app` route group). A página de login é considerada responsiva por ser simples.
