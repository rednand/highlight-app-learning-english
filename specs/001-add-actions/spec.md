# Feature Specification: Automated Test Coverage for Server Actions

**Feature Branch**: `001-add-actions`

**Created**: 2026-05-20

**Status**: Draft

**Input**: User description: "add-actions feature"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Validates Business Logic Safely (Priority: P1)

As a developer making changes to the SM-2 review algorithm or the streak calculation, I want to run a suite of automated tests that verify the core logic behaves correctly, so I can refactor or extend the code without fear of introducing silent regressions.

**Why this priority**: The SM-2 and streak systems are the core value drivers of the app — a silent bug in either would degrade the learning experience for all users without any visible error. Tests here have the highest safety ROI.

**Independent Test**: Can be fully tested by running the test suite and confirming SM-2 scheduling and streak calculations produce correct outputs across all edge cases (first review, missed streak, consecutive days).

**Acceptance Scenarios**:

1. **Given** the SM-2 algorithm receives a grade of 1, **When** the test suite runs, **Then** the card's interval resets to 1 day and ease factor decreases.
2. **Given** a user has reviewed on consecutive days, **When** the streak tests run, **Then** the streak count increments correctly.
3. **Given** a user missed a day, **When** the streak tests run, **Then** the streak resets to 1.

---

### User Story 2 - Developer Verifies Server Action Contracts (Priority: P2)

As a developer modifying server actions (review, lessons, items, grammar, roadmap), I want automated tests that verify each action's contract with the database — what it reads, what it writes, and how it handles errors — so I can refactor with confidence.

**Why this priority**: Server actions are the mutation layer of the app; broken actions cause data loss or silent failures. Tests here catch API contract regressions before production.

**Independent Test**: Can be fully tested by running the server action tests against mocked database clients and confirming each action returns the expected result or handles the expected error path.

**Acceptance Scenarios**:

1. **Given** a user is not authenticated, **When** any server action is called, **Then** the action returns a safe default (no data, no mutation).
2. **Given** a database error occurs, **When** a read action runs, **Then** the action returns a null/empty result without throwing.
3. **Given** valid input, **When** a mutation action runs, **Then** the database client receives the correct arguments.

---

### User Story 3 - CI Pipeline Blocks Failing Commits (Priority: P3)

As a developer opening a pull request, I want the CI pipeline to automatically run the full test suite and block the merge if any test fails, so broken logic cannot reach the main branch.

**Why this priority**: Manual test runs are unreliable; automation closes the loop on quality gates. This story depends on P1 and P2 being in place first.

**Independent Test**: Can be fully tested by pushing a branch with a deliberately broken test and confirming the CI pipeline reports failure and blocks merge.

**Acceptance Scenarios**:

1. **Given** all tests pass, **When** a pull request is opened, **Then** the CI check reports success.
2. **Given** any test fails, **When** a pull request is opened, **Then** the CI check reports failure and the PR cannot be merged.
3. **Given** a new server action is added without tests, **When** the suite runs, **Then** existing coverage for other actions is unaffected.

---

### Edge Cases

- What happens when a server action is called with an empty string ID? The test must verify safe handling without crashing.
- How does the streak logic handle timezone differences (user in UTC-3 reviewing at 11 PM local time)?
- What happens if the database client mock is not reset between tests — can state leak between test cases?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide pure, side-effect-free utility functions for the SM-2 scheduling algorithm that can be tested in isolation from the database.
- **FR-002**: The system MUST provide pure, side-effect-free utility functions for streak calculation (compute streak, compute new days, today/yesterday boundaries) that can be tested in isolation.
- **FR-003**: The test suite MUST cover all server actions: review (fetch flashcards, update flashcard, get streak, update streak), lessons (create, update, delete), items (create, update, delete), grammar (progress), roadmap (progress), and examples.
- **FR-004**: The test suite MUST cover the unauthenticated path for all server actions that require a logged-in user.
- **FR-005**: The test suite MUST cover the database error path for all read server actions.
- **FR-006**: The CI pipeline MUST automatically execute the full test suite on every pull request opened against the main branch.
- **FR-007**: The CI pipeline MUST fail and block merge if any test does not pass.
- **FR-008**: Tests MUST run without requiring a live database connection or network access (all external dependencies must be replaceable with test doubles).

### Key Entities

- **Pure Utility Module**: A file containing only deterministic functions with no I/O or framework dependencies — importable and runnable in any environment including test runners.
- **Server Action**: A server-side function that authenticates the user and performs a database operation. Tests exercise these with a mocked database client.
- **Test Suite**: The collection of all automated tests organized by domain (review, lessons, items, etc.).
- **CI Pipeline**: The automated workflow that runs on each pull request to execute tests and report status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of SM-2 scheduling branches (grade < 3, interval = 1, interval > 1) are covered by passing tests.
- **SC-002**: 100% of streak calculation branches (first review, today already reviewed, yesterday reviewed, streak broken) are covered by passing tests.
- **SC-003**: Every server action domain (review, lessons, items, grammar, roadmap, examples) has at least one passing test for the happy path and one for the unauthenticated path.
- **SC-004**: The CI pipeline executes the test suite and reports a result on every pull request within 3 minutes.
- **SC-005**: Zero tests rely on a live network call or real database connection.

## Assumptions

- The project already has all server actions implemented; this feature adds tests and pure utility extraction, not new business features.
- Streak boundary logic uses UTC date strings (`YYYY-MM-DD`); timezone handling at the UI layer is out of scope.
- Mobile nav and quiz client UI component tests are included in scope as smoke tests, not full visual regression tests.
- The CI environment has access to install dependencies from the package registry.
- Existing server actions will not be renamed or restructured as part of this feature — only extracted utility functions and tests are added.
