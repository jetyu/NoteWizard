interface CapturedTool {
  name: string;
  invoke: (args: unknown) => Promise<string>;
}

interface MockAgentConfig {
  tools: CapturedTool[];
  middleware: unknown[];
}

const mocks = vi.hoisted(() => {
  class MockToolCallLimitExceededError extends Error {}
  class MockNoteImageAccessError extends Error {}

  const agentInvoke = vi.fn<(input: unknown, tools: CapturedTool[]) => Promise<unknown>>();
  const createAgent = vi.fn((config: MockAgentConfig) => ({
    invoke: (input: unknown) => agentInvoke(input, config.tools),
  }));
  const deleteThread = vi.fn(async (): Promise<void> => undefined);

  return {
    MockToolCallLimitExceededError,
    MockNoteImageAccessError,
    agentInvoke,
    createAgent,
    deleteThread,
    toolCallLimitMiddleware: vi.fn((options: unknown) => ({ type: 'tool-call-limit', options })),
    searchKnowledgeBase: vi.fn(),
    indexNote: vi.fn(async (): Promise<void> => undefined),
    deleteNoteIndex: vi.fn(async (): Promise<{ success: boolean }> => ({ success: true })),
    assessEvidence: vi.fn(() => ({ sufficient: true })),
    getAllNodes: vi.fn(),
    readContent: vi.fn(),
    writeContent: vi.fn(async (): Promise<void> => undefined),
    createFile: vi.fn(),
    renameNode: vi.fn(),
    moveNode: vi.fn(),
    deleteNodes: vi.fn(),
    restoreNode: vi.fn(),
    getNoteImageManifest: vi.fn(),
    readNoteImage: vi.fn(),
    understandImage: vi.fn(),
  };
});

vi.mock('langchain', () => ({
  createAgent: mocks.createAgent,
  humanInTheLoopMiddleware: (options: unknown) => ({ type: 'hitl', options }),
  toolCallLimitMiddleware: mocks.toolCallLimitMiddleware,
  ToolCallLimitExceededError: mocks.MockToolCallLimitExceededError,
  tool: (invoke: (args: unknown) => Promise<string>, options: { name: string }) => ({
    name: options.name,
    invoke,
  }),
}));

vi.mock('@langchain/langgraph', () => ({
  Command: class MockCommand {
    constructor(public readonly value: unknown) {}
  },
  MemorySaver: class MockMemorySaver {
    deleteThread = mocks.deleteThread;
  },
}));

vi.mock('../../electron/main/services/ai-provider.service.js', () => ({
  createProviderChatModel: () => ({
    invoke: vi.fn(async () => ({ text: '' })),
  }),
}));

vi.mock('../../electron/main/services/built-in-ai.service.js', () => ({
  builtInAiService: {
    toUserFacingError: (error: unknown) => error,
  },
}));

vi.mock('../../electron/main/services/error.service.js', () => ({
  getErrorMessage: (error: unknown) => error instanceof Error ? error.message : String(error),
}));

vi.mock('../../electron/main/services/knowledge-copilot/knowledge-copilot-index.service.js', () => ({
  knowledgeCopilotIndexService: {
    searchKnowledgeBase: mocks.searchKnowledgeBase,
    indexNote: mocks.indexNote,
    deleteNoteIndex: mocks.deleteNoteIndex,
  },
}));

vi.mock('../../electron/main/services/knowledge-copilot/knowledge-evidence-assessment.service.js', () => ({
  assessKnowledgeEvidence: mocks.assessEvidence,
}));

vi.mock('../../electron/main/services/knowledge-copilot/knowledge-copilot-qa.service.js', () => ({
  ensureKnowledgeCopilotReady: vi.fn(async () => ({
    agentChatConfig: {
      provider: 'openai',
      baseUrl: 'https://example.test',
      apiKey: 'test-key',
      model: 'test-model',
    },
    knowledgeCopilot: {
      topK: 5,
      similarityThreshold: 0.5,
    },
    rerankerConfig: undefined,
    uiLanguage: 'en-US',
  })),
}));

vi.mock('../../electron/main/services/vfs.service.js', () => ({
  NoteImageAccessError: mocks.MockNoteImageAccessError,
  vfsService: {
    getAllNodes: mocks.getAllNodes,
    readContent: mocks.readContent,
    writeContent: mocks.writeContent,
    createFile: mocks.createFile,
    renameNode: mocks.renameNode,
    moveNode: mocks.moveNode,
    deleteNodes: mocks.deleteNodes,
    restoreNode: mocks.restoreNode,
    getNoteImageManifest: mocks.getNoteImageManifest,
    readNoteImage: mocks.readNoteImage,
  },
}));

vi.mock('../../electron/main/services/knowledge-copilot/knowledge-copilot-image.service.js', () => ({
  understandKnowledgeCopilotImage: mocks.understandImage,
}));

vi.mock('../../electron/main/constants/vfs.constants.js', () => ({
  VFS_CONSTANTS: {
    NODE_TYPE_FILE: 'file',
  },
}));

vi.mock('../../electron/main/prompts/index.js', () => ({
  buildAgentSystemPrompt: () => 'agent prompt',
  buildKnowledgeConversationSummaryPrompt: () => 'summary prompt',
}));

vi.mock('../../electron/main/utils/i18n.js', () => ({
  $t: (_key: string, fallback: string) => fallback,
}));

vi.mock('../../electron/main/services/knowledge-copilot/knowledge-copilot-conversation-context.service.js', () => ({
  formatKnowledgeCopilotConversationContext: () => '',
  getKnowledgeCopilotSummaryCandidates: () => [],
}));

import { runKnowledgeCopilotTask } from '../../electron/main/services/knowledge-copilot/knowledge-copilot-task.service';

const activeNote = {
  id: 'note-1',
  name: 'Note 1',
  type: 'file',
  trashed: false,
  contentId: 'content-1',
  updatedAt: 1,
};

const sufficientSearchResults = [{
  chunk: {
    id: 'chunk-1',
    noteId: 'note-1',
    content: 'Evidence',
    startPos: 0,
    endPos: 8,
  },
  noteTitle: 'Note 1',
  score: 0.9,
}];

function findTool(tools: CapturedTool[], name: string): CapturedTool {
  const selected = tools.find((candidate) => candidate.name === name);
  if (!selected) throw new Error(`Missing captured tool: ${name}`);
  return selected;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAllNodes.mockReturnValue([activeNote]);
  mocks.readContent.mockResolvedValue('Short content');
  mocks.searchKnowledgeBase.mockResolvedValue(sufficientSearchResults);
  mocks.assessEvidence.mockReturnValue({ sufficient: true });
  mocks.getNoteImageManifest.mockResolvedValue([]);
  mocks.readNoteImage.mockResolvedValue({
    noteId: 'note-1',
    imageIndex: 0,
    altText: 'scan',
    mediaType: 'image/png',
    byteSize: 4,
    data: Buffer.from([1, 2, 3, 4]),
  });
  mocks.understandImage.mockResolvedValue({
    content: 'OCR result',
    truncated: false,
    originalLength: 10,
  });
  mocks.agentInvoke.mockResolvedValue({ messages: [{ content: 'Done' }] });
});

describe('Knowledge Agent runtime safety', () => {
  it('preserves evidence and write mode across an HITL resume', async () => {
    let invocation = 0;
    mocks.agentInvoke.mockImplementation(async (_input, tools) => {
      invocation += 1;
      if (invocation === 1) {
        await findTool(tools, 'searchKnowledgeBase').invoke({ query: 'evidence' });
        return {
          __interrupt__: [{
            value: {
              actionRequests: [{
                name: 'updateNote',
                args: { noteId: 'note-1', content: 'Updated', reason: 'Requested' },
              }],
              reviewConfigs: [{ allowedDecisions: ['approve', 'edit', 'reject'] }],
            },
          }],
        };
      }

      await findTool(tools, 'updateNote').invoke({
        noteId: 'note-1',
        content: 'Updated',
        reason: 'Requested',
      });
      return { messages: [{ content: 'Updated the note.' }] };
    });

    const interrupted = await runKnowledgeCopilotTask('Update the note', { writeMode: 'confirm' });
    const interruptedTraceCount = interrupted.traceEvents.length;
    expect(interrupted.stopReason).toBe('interrupted');
    expect(interrupted.sources).toHaveLength(1);
    expect(mocks.deleteThread).not.toHaveBeenCalled();

    const resumed = await runKnowledgeCopilotTask('', {
      writeMode: 'auto',
      conversationId: interrupted.conversationId,
      decisions: [{ type: 'approve' }],
    });

    expect(resumed.writeMode).toBe('confirm');
    expect(resumed.sources).toHaveLength(1);
    expect(resumed.traceEvents.length).toBeGreaterThan(interruptedTraceCount);
    expect(resumed.executedWrites).toHaveLength(1);
    expect(mocks.writeContent).toHaveBeenCalledWith('content-1', 'Updated');
    expect(mocks.deleteThread).toHaveBeenCalledWith(interrupted.conversationId);
  });

  it('keeps insufficient-evidence write protection after an HITL resume', async () => {
    mocks.searchKnowledgeBase.mockResolvedValue([]);
    mocks.assessEvidence.mockReturnValue({ sufficient: false });
    let invocation = 0;
    let updateResponse = '';
    mocks.agentInvoke.mockImplementation(async (_input, tools) => {
      invocation += 1;
      if (invocation === 1) {
        await findTool(tools, 'searchKnowledgeBase').invoke({ query: 'missing evidence' });
        return {
          __interrupt__: [{
            value: {
              actionRequests: [{
                name: 'updateNote',
                args: { noteId: 'note-1', content: 'Unsafe', reason: 'Requested' },
              }],
              reviewConfigs: [{ allowedDecisions: ['approve', 'reject'] }],
            },
          }],
        };
      }

      updateResponse = await findTool(tools, 'updateNote').invoke({
        noteId: 'note-1',
        content: 'Unsafe',
        reason: 'Requested',
      });
      return { messages: [{ content: 'No update was made.' }] };
    });

    const interrupted = await runKnowledgeCopilotTask('Update without evidence', { writeMode: 'confirm' });
    const resumed = await runKnowledgeCopilotTask('', {
      conversationId: interrupted.conversationId,
      decisions: [{ type: 'approve' }],
    });

    expect(JSON.parse(updateResponse)).toMatchObject({ success: false });
    expect(resumed.stopReason).toBe('insufficient-evidence');
    expect(mocks.writeContent).not.toHaveBeenCalled();
  });

  it('reports the configured LangChain tool-call limit as a terminal result', async () => {
    mocks.agentInvoke.mockRejectedValue(new mocks.MockToolCallLimitExceededError('limit'));

    const result = await runKnowledgeCopilotTask('Keep calling tools', { writeMode: 'auto' });

    expect(mocks.toolCallLimitMiddleware).toHaveBeenCalledWith({
      threadLimit: 8,
      exitBehavior: 'error',
    });
    expect(result.stopReason).toBe('tool-call-limit');
    expect(result.finalAnswer).toContain('tool call limit');
    expect(mocks.writeContent).not.toHaveBeenCalled();
    expect(mocks.deleteThread).toHaveBeenCalledWith(result.conversationId);
  });

  it('discloses bounded reads and blocks replacement of a long note', async () => {
    const longContent = 'x'.repeat(6001);
    mocks.readContent.mockResolvedValue(longContent);
    let readResponse = '';
    let updateResponse = '';
    mocks.agentInvoke.mockImplementation(async (_input, tools) => {
      readResponse = await findTool(tools, 'readNote').invoke({ noteId: 'note-1' });
      updateResponse = await findTool(tools, 'updateNote').invoke({
        noteId: 'note-1',
        content: 'Replacement',
        reason: 'Requested',
      });
      return { messages: [{ content: 'Done' }] };
    });

    await runKnowledgeCopilotTask('Read and update the long note', { writeMode: 'auto' });

    const readPayload = JSON.parse(readResponse) as {
      note: { content: string; truncated: boolean; originalLength: number };
    };
    expect(readPayload.note.content).toHaveLength(6000);
    expect(readPayload.note.truncated).toBe(true);
    expect(readPayload.note.originalLength).toBe(6001);
    expect(JSON.parse(updateResponse)).toMatchObject({ success: false });
    expect(mocks.writeContent).not.toHaveBeenCalled();
  });

  it('keeps a completed workspace update successful when indexing fails', async () => {
    mocks.indexNote.mockRejectedValue(new Error('Index unavailable'));
    let updateResponse = '';
    mocks.agentInvoke.mockImplementation(async (_input, tools) => {
      updateResponse = await findTool(tools, 'updateNote').invoke({
        noteId: 'note-1',
        content: 'Updated',
        reason: 'Requested',
      });
      return { messages: [{ content: 'Updated the note.' }] };
    });

    const result = await runKnowledgeCopilotTask('Update the note', { writeMode: 'auto' });

    expect(JSON.parse(updateResponse)).toMatchObject({
      success: true,
      indexWarning: 'Index unavailable',
    });
    expect(result.executedWrites).toHaveLength(1);
    expect(result.steps).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'updateNote', status: 'completed' }),
      expect.objectContaining({ title: 'refreshNoteIndex', status: 'failed' }),
    ]));
  });

  it('allows readNote to lead to readNoteImage without exposing image data in trace', async () => {
    mocks.getNoteImageManifest.mockResolvedValue([{
      imageIndex: 0,
      altText: 'scan',
      available: true,
      mediaType: 'image/png',
      byteSize: 4,
    }]);
    let readNoteResponse = '';
    let imageResponse = '';
    mocks.agentInvoke.mockImplementation(async (_input, tools) => {
      readNoteResponse = await findTool(tools, 'readNote').invoke({ noteId: 'note-1' });
      imageResponse = await findTool(tools, 'readNoteImage').invoke({
        noteId: 'note-1',
        imageIndex: 0,
      });
      return { messages: [{ content: 'The image says OCR result.' }] };
    });

    const result = await runKnowledgeCopilotTask('Read the image', { writeMode: 'auto' });

    expect(JSON.parse(readNoteResponse)).toMatchObject({
      success: true,
      note: {
        content: 'Short content',
        images: [{ imageIndex: 0, available: true }],
      },
    });
    expect(JSON.parse(imageResponse)).toMatchObject({
      success: true,
      contentClassification: 'untrusted-note-image-data',
      understanding: { content: 'OCR result' },
    });
    const imageTrace = result.traceEvents.find((event) => (
      event.toolName === 'readNoteImage' && event.type === 'tool-result'
    ));
    expect(imageTrace?.detail).toContain('"mediaType":"image/png"');
    expect(imageTrace?.detail).not.toContain('OCR result');
    expect(imageTrace?.detail).not.toContain('base64');
    expect(mocks.indexNote).not.toHaveBeenCalled();
  });

  it('returns a structured image failure and lets later read-only steps continue', async () => {
    mocks.readNoteImage.mockRejectedValueOnce(new mocks.MockNoteImageAccessError('missing'));
    let imageResponse = '';
    let recentNotesResponse = '';
    mocks.agentInvoke.mockImplementation(async (_input, tools) => {
      imageResponse = await findTool(tools, 'readNoteImage').invoke({
        noteId: 'note-1',
        imageIndex: 0,
      });
      recentNotesResponse = await findTool(tools, 'listRecentNotes').invoke({ limit: 1 });
      return { messages: [{ content: 'The image was unavailable.' }] };
    });

    const result = await runKnowledgeCopilotTask('Read the image, then continue', { writeMode: 'auto' });

    expect(JSON.parse(imageResponse)).toMatchObject({
      success: false,
      error: 'This note image is unavailable or has changed.',
    });
    expect(JSON.parse(recentNotesResponse)).toMatchObject({ success: true });
    expect(result.finalAnswer).toBe('The image was unavailable.');
    expect(result.traceEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({ toolName: 'readNoteImage', type: 'tool-error' }),
      expect.objectContaining({ toolName: 'listRecentNotes', type: 'tool-result' }),
    ]));
  });
});
