# Feature Specification: Cinema Mode — Quiz por Origem da Mídia

**Feature Branch**: `004-cinema-source-quiz`

**Created**: 2026-05-21

**Status**: Draft

**Input**: User description: "na sessao modo cinema ao inves de mostrar palavras como opcoes de resposta nos flashcards, é pra mostrar opçoes de filmes, serie, musica"

## Clarifications

### Session 2026-05-21

*(Nenhuma clarificação interativa necessária — requisito claro o suficiente para assumir padrões razoáveis.)*

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Quiz por Origem no Modo Cinema (Priority: P1)

O usuário inicia uma sessão no Modo Cinema. Cada card exibe a palavra em inglês junto com o contexto em que foi ouvida (frase de exemplo). Em vez de escolher a tradução correta entre 4 opções, o usuário deve identificar **de qual filme, série ou música** aquela palavra veio. As 4 opções (A, B, C, D) exibem títulos de mídias — uma é a origem correta da palavra, as outras três são títulos de outras mídias do vocabulário do usuário.

**Why this priority**: Esta é a mudança central solicitada. O Modo Cinema tem uma proposta distinta do modo normal: o desafio é contextual (lembrar onde ouviu), não lexical (lembrar a tradução). Separar as mecânicas reforça essa identidade.

**Independent Test**: Iniciar uma sessão no Modo Cinema e verificar que todas as opções exibem títulos de mídia (filmes, séries, músicas), que a opção correta é a mídia de origem da palavra, e que as demais são títulos de outras mídias salvas pelo usuário.

**Acceptance Scenarios**:

1. **Given** o usuário tem flashcards de lições do tipo filme/série/música, **When** inicia o Modo Cinema, **Then** cada card exibe a palavra, o contexto (frase de exemplo), e 4 títulos de mídia como opções (A, B, C, D).
2. **Given** um card é exibido, **When** o usuário seleciona o título correto, **Then** a opção fica verde, o SM-2 atualiza como "lembrei", e a sessão avança após 1,5 s.
3. **Given** um card é exibido, **When** o usuário seleciona o título errado, **Then** a opção escolhida fica vermelha e o título correto fica verde, o SM-2 atualiza como "não lembrei", e a sessão avança.
4. **Given** as 4 opções são exibidas, **When** o usuário visualiza o card, **Then** a opção correta aparece em posição aleatória (A, B, C ou D) a cada apresentação.
5. **Given** o usuário responde (certo ou errado), **When** o feedback é exibido, **Then** a palavra e sua tradução correta são reveladas abaixo das opções antes de avançar.

---

### User Story 2 — Distractors de Mídia com Fallback (Priority: P2)

O usuário tem poucas lições de mídia salvas (menos de 4 títulos únicos no vocabulário). O sistema deve ainda exibir 4 opções distintas, recorrendo a títulos de outras lições do usuário que não sejam de mídia (filmes gerais, livros, etc.) quando necessário.

**Why this priority**: Garante a viabilidade do quiz mesmo para usuários que estão começando a adicionar conteúdo de mídia.

**Independent Test**: Com um usuário que possui apenas 2 lições de mídia, iniciar o Modo Cinema e verificar que 4 opções distintas aparecem sem crash.

**Acceptance Scenarios**:

1. **Given** o usuário tem menos de 3 títulos de mídia únicos além da origem correta, **When** o card é exibido, **Then** os slots restantes de distractor são preenchidos com títulos de outras lições do usuário (mesmo que não sejam de mídia).
2. **Given** não há títulos suficientes em nenhuma fonte, **When** o Modo Cinema é iniciado, **Then** o sistema exibe uma mensagem informando que mais conteúdo de mídia é necessário, sem travar.

---

### Edge Cases

- O que acontece se duas palavras diferentes vierem da mesma lição? Os distractors podem repetir o mesmo título para cards diferentes na mesma sessão, mas não dentro do mesmo card.
- O que acontece se uma lição não tiver título? O título deve sempre estar presente como pré-condição para criar uma lição; este cenário é tratado como dado inválido.
- O que acontece se o usuário tiver apenas 1 lição de mídia com flashcards devidos? O fallback busca títulos de outras lições não-mídia.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: No Modo Cinema, as 4 opções de resposta (A, B, C, D) DEVEM exibir **títulos de mídias** (filmes, séries ou músicas), não traduções de palavras.
- **FR-002**: A opção correta DEVE ser o título da lição de origem do flashcard sendo revisado.
- **FR-003**: As 3 opções incorretas DEVEM ser títulos de outras lições do usuário (priorizando lições de mídia; completando com outras lições se necessário), distintos entre si e do título correto.
- **FR-004**: A posição da opção correta DEVE ser embaralhada aleatoriamente entre A–D a cada exibição.
- **FR-005**: Após a seleção da resposta, o sistema DEVE revelar a tradução correta da palavra antes de avançar automaticamente.
- **FR-006**: O mecanismo de feedback visual (correto = verde, errado = vermelho + correto = verde) DEVE ser mantido igual ao modo normal.
- **FR-007**: O botão "Pular" DEVE funcionar da mesma forma que no modo normal (re-enfileiramento único, sem impacto no SM-2).
- **FR-008**: Quando o usuário acertar, o SM-2 DEVE registrar "lembrei" (grade 5); quando errar, DEVE registrar "não lembrei" (grade 1) — idêntico ao modo normal.
- **FR-009**: Quando títulos de mídia insuficientes estiverem disponíveis (< 3 distractors), o sistema DEVE buscar títulos de outras lições do usuário como fallback.

### Key Entities

- **Flashcard de Cinema**: Flashcard cujo `lesson_items.lessons.source_type` é `'movie'`, `'tv'` ou `'music'`. Possui um título de mídia (`lessons.title`) como sua origem.
- **Opção de Título**: Uma das 4 opções A–D exibidas no quiz do Modo Cinema; contém o título da lição e, se disponível, o pôster/thumbnail para identificação visual.
- **Pool de Títulos**: Conjunto de todos os títulos de lições do usuário usado para gerar distractors. Prioriza lições de mídia; complementa com demais lições se necessário.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos cards no Modo Cinema exibem títulos de mídia como opções, não traduções.
- **SC-002**: Após cada resposta, a tradução correta da palavra é exibida antes do avanço automático.
- **SC-003**: O Modo Cinema mantém a mesma taxa de atualização do SM-2 que o modo normal — cada card resulta em exatamente uma atualização de grade.
- **SC-004**: Usuários com no mínimo 4 lições de qualquer tipo conseguem completar uma sessão no Modo Cinema sem mensagem de erro.
- **SC-005**: A posição do título correto varia entre A–D em pelo menos 3 posições distintas a cada 10 cards consecutivos da mesma palavra (verificação de embaralhamento).

## Assumptions

- O título da lição (`lessons.title`) é sempre preenchido; não há lições sem título no sistema.
- O pôster/thumbnail da lição pode não estar disponível para todas as mídias; nesse caso, um placeholder visual é exibido em lugar da imagem.
- O modo normal (revisão de traduções) continua inalterado; esta feature afeta exclusivamente o Modo Cinema.
- Um flashcard de cinema pode ter sua origem em lições marcadas como `source_type = 'movie'`, `'tv'` ou `'music'`; todos os três tipos participam do Modo Cinema.
- A tradução revelada após a resposta é o campo `back` do flashcard (tradução PT-BR da palavra).
- O comportamento de skip, feedback visual, auto-avanço e atalhos de teclado permanecem idênticos ao modo normal — apenas o conteúdo das opções muda.
