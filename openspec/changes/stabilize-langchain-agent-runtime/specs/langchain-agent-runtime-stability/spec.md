## ADDED Requirements

### Requirement: Agent tool contract matches registered tools
Knowledge Agent SHALL instruct the model to call the actual registered tool names and SHALL describe HITL confirmation as middleware behavior rather than nonexistent proposal tools.

#### Scenario: Confirm mode needs to create or update a note
- **WHEN** Agent determines that `createNote` or `updateNote` is required in confirm mode
- **THEN** it calls that registered tool name
- **AND** execution pauses for the existing HITL approval instead of requesting a `proposeCreateNote` or `proposeUpdateNote` tool

### Requirement: HITL resume preserves runtime policy and evidence
The application SHALL preserve one Agent task's business runtime state and original write mode across in-process HITL interrupt and resume operations.

#### Scenario: Resume after knowledge search
- **WHEN** an Agent task searches the knowledge base and then pauses for a write confirmation
- **THEN** the resumed execution retains prior sources, evidence assessment, trace events, executed writes, and original write mode

#### Scenario: Insufficient evidence precedes a confirmed write
- **WHEN** search evidence was insufficient before Agent requested a create or update action
- **THEN** approving the interrupted action MUST NOT reset the evidence state or bypass the write guard

#### Scenario: Agent reaches a terminal state
- **WHEN** an Agent task completes, is cancelled, exceeds its tool limit, or fails without a resumable interrupt
- **THEN** Main removes its in-process runtime session and LangGraph checkpoint

### Requirement: Tool call limit stops the graph
Knowledge Agent SHALL enforce a maximum of eight tool calls for the entire Agent thread, including calls before and after HITL resumes.

#### Scenario: Ninth tool call is requested
- **WHEN** the model requests a tool after eight calls have already been counted in the thread
- **THEN** LangChain stops Agent execution and the result reports `tool-call-limit`
- **AND** no ninth workspace action is executed

### Requirement: Agent never replaces a note from truncated input
Knowledge Agent MUST disclose when `readNote` returns truncated content and MUST reject full-note replacement when the current note exceeds the readable Agent content limit.

#### Scenario: Agent reads a long note
- **WHEN** the note content exceeds the Agent note-content limit
- **THEN** `readNote` returns bounded content together with `truncated: true` and the original length

#### Scenario: Agent attempts to update a long note
- **WHEN** the current note exceeds the Agent note-content limit and Agent calls `updateNote`
- **THEN** Main rejects the update before writing any content
- **AND** the existing note remains unchanged

### Requirement: Workspace success is not reversed by index failure
Knowledge Agent SHALL report a completed VFS mutation as executed even if the subsequent knowledge-index refresh fails.

#### Scenario: Create or update succeeds and index refresh fails
- **WHEN** the VFS operation completes but reindexing throws an error
- **THEN** the tool reports the workspace action as successful with an index warning
- **AND** executed writes and steps reflect the mutation that actually occurred

#### Scenario: Rename, move, trash, or restore succeeds and index refresh fails
- **WHEN** the workspace operation completes but index maintenance fails
- **THEN** the tool reports the completed workspace action and a separate index warning instead of claiming that the workspace action failed

### Requirement: Resumed Agent results are fully applied
The Renderer SHALL apply a resumed Agent result to the same persisted question using the same completion semantics as the initial run.

#### Scenario: User approves or edits a pending action
- **WHEN** the resumed Agent returns a final answer, sources, conversation summary, trace, executed writes, and no further pending actions
- **THEN** the existing question record is updated with those results and completed status
- **AND** the workspace is refreshed when writes were executed

#### Scenario: Resume creates another pending action
- **WHEN** the resumed Agent pauses again
- **THEN** accumulated metadata is updated without duplicating earlier trace events or executed writes
- **AND** the new pending actions remain available in the current process

#### Scenario: User rejects a pending action
- **WHEN** Agent resumes after rejection and produces a final response
- **THEN** the final response and conversation summary are persisted even though no workspace write was executed
