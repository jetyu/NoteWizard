## ADDED Requirements

### Requirement: Agent discovers images embedded in a note
Knowledge Agent SHALL inspect supported Markdown image references when reading a note and SHALL expose an ordered image manifest without returning image bytes or unrestricted filesystem paths.

#### Scenario: Note contains managed local images
- **WHEN** Agent calls `readNote` for an active note containing inline Markdown references to images managed under that note's VFS image directory
- **THEN** the tool returns the existing Markdown content and an ordered manifest containing an `imageIndex`, alt text, and availability metadata for each reference
- **AND** the manifest does not contain image bytes, data URLs, base64 content, or an absolute filesystem path

#### Scenario: Note contains no images
- **WHEN** Agent calls `readNote` for a note without Markdown image references
- **THEN** the tool returns the existing Markdown content and an empty image manifest

#### Scenario: Note contains an unavailable image reference
- **WHEN** a Markdown image reference is remote, absolute, outside the note image directory, unsupported, or missing
- **THEN** `readNote` marks that manifest entry unavailable without fetching or reading the referenced resource

### Requirement: Agent can understand one note image on demand
Knowledge Agent SHALL provide a read-only `readNoteImage` tool that uses the currently configured Agent Chat model to extract legible text and a concise visual description from one available image.

#### Scenario: Agent needs information from a local image
- **WHEN** Agent has read a note manifest and calls `readNoteImage` with that note ID and an available image index
- **THEN** Main sends a standard multimodal request containing the selected image and a fixed image-understanding instruction to the configured Agent Chat model
- **AND** the tool returns bounded OCR text and visual description as untrusted reference material

#### Scenario: Agent Chat uses Snaptium AI
- **WHEN** the configured Agent Chat source is Snaptium AI and Agent reads a supported note image
- **THEN** the multimodal request uses the existing Snaptium AI chat model, authentication, error normalization, and request routing

#### Scenario: Agent Chat uses a custom source
- **WHEN** the configured Agent Chat source is not Snaptium AI
- **THEN** image understanding uses that configured source
- **AND** the system MUST NOT silently send the image to Snaptium AI or any other source

#### Scenario: Configured model rejects image input
- **WHEN** the configured Agent Chat model does not support the multimodal request or fails to recognize the image
- **THEN** `readNoteImage` returns a structured failure for that image
- **AND** the Agent task can continue using the Markdown content and alt text

#### Scenario: Active task is cancelled during recognition
- **WHEN** the active Agent task is cancelled while `readNoteImage` is awaiting the model
- **THEN** the image-understanding request observes the task cancellation signal and no later Agent step is started

### Requirement: Note image access is content-scoped
Main MUST derive an image candidate from the active note and current Markdown manifest, and MUST reject any candidate that is not a supported regular file contained by the real VFS image directory for that note's content ID.

#### Scenario: Model supplies a path traversal attempt
- **WHEN** Markdown or tool input would resolve outside `Database/images/<contentId>/`
- **THEN** Main rejects the image read before loading file bytes

#### Scenario: Image path escapes through a symbolic link
- **WHEN** the normalized path appears contained but its real path escapes the note image directory through a symbolic link or equivalent filesystem indirection
- **THEN** Main rejects the image read

#### Scenario: Image index is not in the current manifest
- **WHEN** `readNoteImage` receives an index that is absent after Main reparses the current note content
- **THEN** Main rejects the request without accepting a replacement path from Agent

#### Scenario: Image exceeds the allowed boundary
- **WHEN** the selected image is not a supported PNG, JPEG, WebP, or GIF regular file, or exceeds 8 MiB
- **THEN** Main rejects the image before constructing a multimodal payload

### Requirement: Image understanding is auditable without exposing image data
Knowledge Agent SHALL trace image-understanding tool activity using bounded metadata and SHALL treat image-derived content as untrusted data rather than executable instructions.

#### Scenario: Image recognition succeeds or fails
- **WHEN** `readNoteImage` completes
- **THEN** Agent trace records the tool name, note ID, image index, supported media type, byte size, duration, and success or failure status
- **AND** logs and trace do not contain image bytes, data URLs, base64 payloads, or the full OCR result

#### Scenario: Image contains instructions addressed to Agent
- **WHEN** visible text in the image asks the model to ignore rules or perform an action
- **THEN** the OCR request and Agent context treat that text only as untrusted note content
- **AND** Agent does not elevate it to system or user instructions

### Requirement: Image OCR does not change knowledge indexing
The application SHALL keep image understanding on demand within Knowledge Agent and SHALL NOT automatically persist OCR output in the knowledge index as part of this capability.

#### Scenario: Note with images is indexed or rebuilt
- **WHEN** Knowledge Copilot indexes or rebuilds a note containing images
- **THEN** the index continues to process the Markdown text according to the existing indexing behavior
- **AND** no image-understanding request is issued solely because of indexing
