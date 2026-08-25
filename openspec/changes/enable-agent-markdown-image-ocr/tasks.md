## 1. Markdown Image Discovery and Safe File Access

- [x] 1.1 Add a typed Markdown image-reference extractor beside the existing destination replacement utilities, preserving document order and covering inline destinations with titles or angle brackets.
- [x] 1.2 Add a VFS read-only note-image resolver that derives candidates from `noteId`/`contentId`, reparses the current note, validates the image index, and enforces real-path containment in `Database/images/<contentId>/`.
- [x] 1.3 Enforce regular-file, PNG/JPEG/WebP/GIF, and 8 MiB limits before loading bytes, and return typed safe metadata without exposing arbitrary filesystem paths.

## 2. Image Understanding Service

- [x] 2.1 Add a Knowledge Copilot image service that builds a fixed prompt-injection-resistant LangChain multimodal message from one validated image and the current Agent Chat model.
- [x] 2.2 Propagate the active task `AbortSignal`, bound the OCR/visual-description result, normalize Provider failures, and ensure custom sources never fall back to Snaptium AI.
- [x] 2.3 Add Simplified Chinese locale entries for any new user-visible image-tool failures while keeping image bytes, data URLs, base64 and full OCR content out of logs.

## 3. Knowledge Agent Integration

- [x] 3.1 Extend `readNote` results with an ordered safe image manifest while preserving the existing Markdown response for notes with or without images.
- [x] 3.2 Register the read-only `readNoteImage(noteId, imageIndex)` Agent tool, count it under the existing tool-call limit, and return structured per-image success or failure without aborting unrelated task steps.
- [x] 3.3 Update Agent prompt and trace handling so image-derived text remains untrusted reference data and trace records only bounded note/image/type/size/duration/status metadata.

## 4. Tests and Verification

- [x] 4.1 Add unit tests for Markdown image discovery, empty/unavailable manifests, path traversal, symlink escape, changed indexes, unsupported formats, missing files, and oversized files.
- [x] 4.2 Add focused tests for Snaptium/custom Provider multimodal payloads, no Provider fallback, cancellation, bounded output, prompt-injection labeling, and sensitive trace/log redaction.
- [x] 4.3 Add an Agent tool-flow regression test proving `readNote` can lead to `readNoteImage` while ordinary text-only note reads and knowledge indexing remain unchanged.
- [x] 4.4 Run the focused unit tests, `npm run build:main`, `npm run typecheck`, and `npm run lint`.
