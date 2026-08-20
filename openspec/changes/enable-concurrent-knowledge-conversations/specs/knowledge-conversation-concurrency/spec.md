## ADDED Requirements

### Requirement: Conversation creation and navigation remain available during generation
The Knowledge Assistant SHALL allow the user to create a new conversation or navigate to another conversation while an Ask or Agent request is active.

#### Scenario: Create a conversation while an answer is generating
- **WHEN** a response is generating in one conversation and the user activates New Conversation
- **THEN** the system creates and opens a new draft conversation without stopping the existing request

#### Scenario: Navigate away and return during generation
- **WHEN** the user leaves a conversation with an active request and later returns before it settles
- **THEN** the original conversation shows its current generation state and accumulated output

### Requirement: Different conversations can generate concurrently
The Knowledge Assistant SHALL allow different conversations to own active Ask or Agent requests at the same time.

#### Scenario: Send from a new conversation while another is active
- **WHEN** one conversation is generating and the user submits a valid message from a different conversation
- **THEN** the system starts the new request without cancelling, replacing, or waiting for the existing request

#### Scenario: Mix Ask and Agent requests across conversations
- **WHEN** an Ask request is active in one conversation and an Agent request is submitted in another conversation, or vice versa
- **THEN** both requests proceed independently with their configured modes and model sources

#### Scenario: Prevent a second request in the same conversation
- **WHEN** the active conversation already owns an Ask, Agent, or Agent-resume request
- **THEN** the system exposes Stop instead of Send and prevents another operation from starting in that conversation

### Requirement: Generation state is owned by its originating conversation
The Knowledge Assistant SHALL associate request identity, progress, partial output, sources, errors, and terminal status with the request's originating question and conversation.

#### Scenario: Background stream emits output
- **WHEN** a background conversation receives progress events or answer deltas
- **THEN** the system updates only the originating question while leaving the active conversation and composer unchanged

#### Scenario: Background request completes
- **WHEN** a background request succeeds, fails, or stops
- **THEN** the system persists that terminal result to the originating conversation without switching conversations, scrolling unrelated content, or stealing input focus

#### Scenario: Concurrent requests settle out of order
- **WHEN** requests from different conversations finish in an order different from submission order
- **THEN** each result and conversation summary is saved to its matching conversation without overwriting another request's data

### Requirement: Stop is scoped to the active conversation
The Knowledge Assistant SHALL display and execute Stop according to the active conversation's request only.

#### Scenario: Stop the foreground conversation
- **WHEN** multiple conversations are generating and the user activates Stop in the currently open conversation
- **THEN** only that conversation's matching request is cancelled and all other conversations continue

#### Scenario: Open a conversation without an active request
- **WHEN** other conversations are generating but the current conversation has no active request
- **THEN** the current composer shows Send and permits a new submission rather than showing a global Stop state

### Requirement: Concurrent failures remain isolated
The Knowledge Assistant SHALL handle provider, network, and cancellation outcomes independently for each active conversation.

#### Scenario: One provider request fails
- **WHEN** one of several concurrent requests fails because of a provider or network error
- **THEN** only the originating turn displays and persists the failure while other requests continue

#### Scenario: One request is cancelled
- **WHEN** one request is cancelled while other requests remain active
- **THEN** only the cancelled turn is persisted as stopped and late events for that request cannot update another turn

### Requirement: Concurrent persistence preserves all conversations
The Knowledge Assistant SHALL merge conversation mutations against the latest workbench state so concurrent request lifecycle updates do not lose unrelated turns or results.

#### Scenario: Two drafts are recorded close together
- **WHEN** different conversations record new draft questions before either generation completes
- **THEN** both questions remain present in their respective persisted conversation threads

#### Scenario: Two results persist close together
- **WHEN** requests from different conversations persist terminal results concurrently
- **THEN** both terminal results and their corresponding summaries remain stored
