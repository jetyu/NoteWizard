## ADDED Requirements

### Requirement: Message content can be copied
The Knowledge Assistant SHALL provide copy actions for every user message and every non-empty assistant response, including agent-task turns.

#### Scenario: Copy user question
- **WHEN** the user activates copy on a user message
- **THEN** the system copies the original question text and displays brief success feedback

#### Scenario: Copy assistant response
- **WHEN** the user activates copy on a non-empty assistant response
- **THEN** the system copies the original Markdown response rather than rendered HTML

### Requirement: Latest ordinary question can be edited in place
The Knowledge Assistant SHALL allow only the latest settled ordinary question in the active conversation to be edited and resent from the bottom composer.

#### Scenario: Begin editing
- **WHEN** the user activates edit on the latest settled ordinary question
- **THEN** the system fills the composer with that question and exposes a cancel-edit action

#### Scenario: Submit edited question
- **WHEN** the user submits the edited question
- **THEN** the system replaces the existing turn without creating another turn and generates a new answer without including the old target turn in context

#### Scenario: Protect earlier and agent turns
- **WHEN** a message is not the latest settled ordinary question or is an agent-task turn
- **THEN** the system does not expose edit or replay actions for that message

### Requirement: Latest ordinary answer can be regenerated or retried
The Knowledge Assistant SHALL allow the latest settled ordinary turn to be regenerated after success or retried after failure or cancellation.

#### Scenario: Regenerate successful answer
- **WHEN** the user activates regenerate on the latest successful ordinary answer
- **THEN** the system replaces its answer and sources in place using the currently selected ask model

#### Scenario: Retry failed or stopped answer
- **WHEN** the latest ordinary turn is failed or stopped and the user activates retry
- **THEN** the system retries the same question in place and clears its prior terminal state

### Requirement: Active ordinary question can be stopped
The Knowledge Assistant SHALL expose a stop control immediately after an ordinary question is accepted and SHALL cancel only the matching active request.

#### Scenario: Stop before streaming starts
- **WHEN** the user activates stop during preparation, rewrite, retrieval, or assessment
- **THEN** the UI stops waiting immediately and the request is cancelled at the earliest supported boundary

#### Scenario: Stop during streaming
- **WHEN** the user activates stop after response deltas have arrived
- **THEN** the system stops accepting new deltas, preserves the partial answer, and records a stopped state rather than an error

#### Scenario: Cancellation race
- **WHEN** stop races with request completion or is invoked more than once
- **THEN** cancellation is idempotent and does not affect another request

### Requirement: Active agent task can be stopped
The Knowledge Assistant SHALL expose the same immediate stop control for an active agent task and SHALL stop future task execution without claiming to undo completed writes.

#### Scenario: Stop active agent task
- **WHEN** the user activates stop after submitting an agent task
- **THEN** the UI stops waiting immediately and the matching LangGraph request is cancelled at the earliest supported boundary

#### Scenario: Agent writes completed before stop
- **WHEN** an agent task has completed one or more writes before cancellation is observed
- **THEN** those writes remain applied and the conversation preserves available executed-write records

### Requirement: Terminal generation state is durable
The Knowledge Assistant SHALL persist failed and stopped states for ordinary question turns so their appropriate recovery action remains available after reopening the conversation.

#### Scenario: Reopen failed conversation
- **WHEN** a conversation containing a failed latest ordinary turn is reopened
- **THEN** the failure message and retry action remain available

#### Scenario: Reopen stopped conversation
- **WHEN** a conversation containing a stopped latest ordinary turn is reopened
- **THEN** the stopped state, any partial answer, and retry action remain available
