# Feature Specification: Flashcard Multiple Choice Review

**Feature Branch**: `003-flashcard-multiple-choice`

**Created**: 2026-05-21

**Status**: Draft

**Input**: User description: "nos Flashcards - Revise suas palavras usando repetição espaçada, eu quero que ao inves de me dar as opções de lembrei, nao lembrei, vc me de opções, tipo a, b, c ou d, onde uma das opções é a certa, a outra é errada, tanto para os flashcards normais quando para o modo cinema"

## Clarifications

### Session 2026-05-21

- Q: How should the 3 distractor options be selected from the user's vocabulary? → A: Randomly from the user's entire saved vocabulary across all lessons (excluding the word being reviewed).
- Q: What happens after the user selects a wrong answer — does the card re-appear in the same session? → A: No re-queue; card is marked as "not remembered" and SM-2 reschedules it normally. Session advances immediately.
- Q: What feedback is shown when the user selects a wrong answer? → A: The selected option is highlighted red AND the correct option is highlighted green simultaneously, before auto-advancing.
- Q: Should there be a "skip" option on cards? → A: Yes — a skip button re-queues the card at the end of the current session with no SM-2 impact.
- Q: Does Cinema Mode also include the Skip button with the same behavior? → A: Yes — Cinema Mode is fully consistent with normal mode, including the Skip button.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multiple Choice in Normal Review Mode (Priority: P1)

The user opens the review session to practice their vocabulary with spaced repetition. Instead of seeing the word and tapping "Remembered" or "Forgot", they are presented with the word and 4 answer options (A, B, C, D). One option is the correct translation; the others are plausible distractors drawn from the user's own vocabulary. The user selects an option, receives immediate visual feedback (correct or incorrect highlight), and the system automatically advances to the next card, updating the spaced-repetition schedule based on whether the answer was right or wrong.

**Why this priority**: This is the core interaction change requested. The entire feature is built around this scenario; all other stories depend on the pattern established here.

**Independent Test**: Can be fully tested by navigating to the review session, completing a full review cycle using only multiple choice selections, and verifying that the review schedule is updated correctly after each answer.

**Acceptance Scenarios**:

1. **Given** a user has words due for review, **When** they open the review session, **Then** each card displays the word along with exactly 4 labelled options (A, B, C, D), with one being the correct translation.
2. **Given** a card is shown with 4 options, **When** the user selects the correct answer, **Then** the correct option is visually highlighted and the word is marked as "remembered" in the spaced-repetition schedule.
3. **Given** a card is shown with 4 options, **When** the user selects a wrong answer, **Then** the selected option is visually highlighted as incorrect, the correct option is revealed, and the word is marked as "not remembered" in the spaced-repetition schedule.
4. **Given** visual feedback is shown after a selection, **When** a brief moment passes, **Then** the system automatically advances to the next card without requiring an extra tap.
5. **Given** the 4 options are displayed, **When** the user views the card, **Then** the correct answer is placed in a random position (not always the same slot) across different cards and sessions.

---

### User Story 2 - Multiple Choice in Cinema Mode (Priority: P2)

The user activates Cinema Mode to review vocabulary in a more immersive format. The same multiple choice mechanic applies: each word is presented with 4 options, one correct and three distractors, following the same interaction and feedback pattern as the normal review mode.

**Why this priority**: Cinema Mode is an existing alternative review experience. It must receive the same improvement so the interaction pattern is consistent across all review surfaces.

**Independent Test**: Can be fully tested by activating Cinema Mode and completing a review session, verifying that multiple choice options appear and function identically to the normal review mode.

**Acceptance Scenarios**:

1. **Given** Cinema Mode is active, **When** a vocabulary card is displayed, **Then** 4 labelled options (A, B, C, D) are shown instead of remembered/forgot buttons.
2. **Given** Cinema Mode is active, **When** the user selects the correct answer, **Then** the spaced-repetition schedule is updated as "remembered" and the session advances.
3. **Given** Cinema Mode is active, **When** the user selects a wrong answer, **Then** the correct answer is revealed, the word is marked as "not remembered", and the session advances.

---

### User Story 3 - Edge Case: Insufficient Vocabulary for Distractors (Priority: P3)

A user with very few saved words (fewer than 4 total) attempts a review session. The system must still present a valid multiple choice card without crashing or showing duplicate options in a confusing way.

**Why this priority**: Edge case that protects app stability for new users who have just started building their vocabulary.

**Independent Test**: Can be tested by creating a test account with fewer than 4 saved words, starting a review session, and verifying that the card renders correctly.

**Acceptance Scenarios**:

1. **Given** a user has fewer than 4 total vocabulary words, **When** a card is shown, **Then** the system fills the remaining distractor slots with words from a fallback source (e.g., other lesson items the user has not yet saved) so that 4 distinct options are always displayed.
2. **Given** no fallback words are available and the system cannot generate 4 distinct options, **When** the review session is opened, **Then** the session falls back gracefully, informing the user that more vocabulary is needed, without crashing.

---

### Edge Cases

- What happens when all due-review words belong to the same lesson and distractors must come from a different source?
- What happens if the user rapidly taps an option before feedback animation completes — is a double-submission possible?
- How does the system behave when a review session has only 1 card remaining?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace "Remembered" / "Forgot" buttons with 4 labelled multiple choice options (A, B, C, D) on every review card in normal review mode.
- **FR-002**: System MUST include exactly one correct answer (the word's stored translation) among the 4 options.
- **FR-003**: System MUST include exactly 3 distractor options, selected randomly from the user's entire saved vocabulary across all lessons (excluding the word currently being reviewed).
- **FR-004**: System MUST randomize the position of the correct answer across the 4 slots (A, B, C, D) on each card presentation.
- **FR-005**: Selecting the correct answer MUST trigger the same spaced-repetition outcome as the previous "Remembered" action.
- **FR-006**: Selecting an incorrect answer MUST trigger the same spaced-repetition outcome as the previous "Forgot" action. The card is NOT re-queued in the current session; SM-2 reschedules it for a future review.
- **FR-007**: System MUST provide immediate visual feedback after a selection: if wrong, the selected option is highlighted red and the correct option is highlighted green simultaneously; if correct, the selected option is highlighted green.
- **FR-008**: System MUST automatically advance to the next card after a brief feedback display, without requiring an additional user action.
- **FR-009**: System MUST apply the same multiple choice format (FR-001 through FR-008 and FR-012 through FR-013) in Cinema Mode, including the Skip button with identical behavior.
- **FR-010**: Once an option is selected, System MUST prevent the user from changing or re-selecting another option for the same card.
- **FR-011**: When fewer than 3 distinct distractor words exist in the user's vocabulary, System MUST source additional distractors from a fallback pool to always present 4 distinct options.
- **FR-012**: System MUST provide a "Skip" button on each review card. Tapping it re-queues the card at the end of the current session without triggering any SM-2 update.
- **FR-013**: A skipped card MUST be presented again before the session ends. If skipped again on the second presentation, it is dismissed from the current session with no SM-2 impact.

### Key Entities

- **Review Card**: Represents a single flashcard in a review session — holds the word to be reviewed, its correct translation, and the 4 multiple choice options generated for this session.
- **Multiple Choice Options**: A set of 4 answer options for a given review card: one correct (the stored translation) and three distractors. Options are labelled A–D and shuffled per card.
- **Distractor**: A wrong answer option sourced randomly from the user's entire saved vocabulary across all lessons (a translation belonging to a different word). Must be distinct from the correct answer and from the other distractors.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete a full spaced-repetition review session using only multiple choice interactions, with no "Remembered/Forgot" buttons visible.
- **SC-002**: After each answer selection, the correct card's next-review date is updated within the same session, consistent with the pre-existing spaced-repetition rules.
- **SC-003**: Cinema Mode behaves identically to normal review mode in terms of multiple choice options, feedback, and spaced-repetition updates.
- **SC-004**: Every review card always displays exactly 4 distinct options, even for users with fewer than 4 total saved words.
- **SC-005**: Every card in a session receives either a correct/incorrect answer or is explicitly skipped — no card is silently dropped mid-session.
- **SC-006**: Skipped cards are re-presented before the session ends, giving the user a second opportunity to answer without SM-2 penalty.

## Assumptions

- Spaced-repetition scoring is binary for this feature: correct selection maps to the existing "remembered" quality score; wrong selection maps to the existing "forgot" quality score. No partial-credit scoring is introduced.
- Distractors are sourced randomly from the translations of the user's entire saved vocabulary across all lessons, not from a global word database.
- If a user's vocabulary is too small to generate 3 unique distractors, fallback content (e.g., translations from lesson items the user has not yet saved but that exist in the same app) may be used to complete the 4 options.
- The brief feedback display duration before auto-advancing is assumed to be approximately 1–2 seconds; the exact timing is a UI detail to be decided during planning.
- Mobile and desktop layout adaptations for the 4-option grid are a visual/UX concern handled during implementation, not a scope boundary of this specification.
- The existing spaced-repetition algorithm (SM-2) is not modified — only the input mechanism changes (from two buttons to a 4-option selection).
