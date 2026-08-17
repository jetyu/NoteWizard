## 1. Provider contract and dependency

- [x] 1.1 Add the Anthropic provider identity, default endpoint, Chat-only capability, and endpoint inference.
- [x] 1.2 Add the LangChain Anthropic integration dependency compatible with the current LangChain core version.

## 2. Native chat integration

- [x] 2.1 Create Anthropic chat models through `ChatAnthropic` with the configured API key, endpoint, model, retries, and temperature.
- [x] 2.2 Verify Anthropic uses the existing Chat connection test and Tool Calling validation while rejecting embedding and reranking construction.

## 3. Settings presentation

- [x] 3.1 Add Anthropic to the selectable provider registry with a local SVG icon and Simplified Chinese label.
- [x] 3.2 Verify selection fills the endpoint, selects only Chat, keeps the model editable, and persists/restores the provider identity.

## 4. Verification

- [x] 4.1 Add focused unit coverage for Anthropic defaults, capabilities, inference, native chat construction, and unsupported capabilities.
- [x] 4.2 Validate the OpenSpec change and run unit tests, main-process build, renderer typecheck, and lint.
