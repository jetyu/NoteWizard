import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

interface KnowledgeCopilotConfigMock {
  embeddingSourceId: string;
  embeddingModel: string;
  rebuildConcurrency: number;
  lastIndexedAt: number | null;
  lastRebuildDurationMs: number | null;
  indexSignatures: Record<string, string>;
  indexChunkCounts: Record<string, number>;
  cachedTotalChunks: number;
}

interface SettingsStoreMock {
  config: {
    knowledgeCopilot: KnowledgeCopilotConfigMock;
    aiSources: {
      sources: Array<{ id: string; provider: 'openai' }>;
    };
  };
  persistence: {
    save: ReturnType<typeof vi.fn>;
  };
}

const mocks = vi.hoisted(() => ({
  settingsStore: null as SettingsStoreMock | null,
  service: {
    initialize: vi.fn(),
    indexNote: vi.fn(),
    getStatus: vi.fn(),
    clearIndex: vi.fn(),
    deleteNoteIndex: vi.fn(),
  },
}));

vi.mock('@renderer/features/knowledge-copilot/services/knowledge-copilot.service', () => ({
  knowledgeCopilotService: mocks.service,
}));

vi.mock('@renderer/features/settings/store/settings.store', () => ({
  useSettingsStore: () => mocks.settingsStore,
}));

vi.mock('@renderer/features/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

import { useKnowledgeCopilotStore } from '../../src/renderer/features/knowledge-copilot/store/knowledge-copilot.store';

const NOTES = [{ id: 'note-1', title: 'Note', content: 'Indexed content' }];

function createStatus(totalChunks: number) {
  return {
    success: true,
    isInitialized: true,
    totalChunks,
    tableName: totalChunks > 0 ? 'knowledge_copilot_chunks' : undefined,
  };
}

function createSettingsStore(): SettingsStoreMock {
  const config: SettingsStoreMock['config'] = {
    knowledgeCopilot: {
      embeddingSourceId: 'embedding-source',
      embeddingModel: 'embedding-model',
      rebuildConcurrency: 1,
      lastIndexedAt: null,
      lastRebuildDurationMs: null,
      indexSignatures: {},
      indexChunkCounts: {},
      cachedTotalChunks: 0,
    },
    aiSources: {
      sources: [{ id: 'embedding-source', provider: 'openai' }],
    },
  };
  const save = vi.fn(async (payload: { knowledgeCopilot: KnowledgeCopilotConfigMock }) => {
    Object.assign(config.knowledgeCopilot, payload.knowledgeCopilot);
    return config;
  });
  return { config, persistence: { save } };
}

async function establishHealthyIndex(): Promise<ReturnType<typeof useKnowledgeCopilotStore>> {
  const store = useKnowledgeCopilotStore();
  mocks.service.indexNote.mockResolvedValue({ success: true, chunksIndexed: 2 });
  mocks.service.getStatus.mockResolvedValueOnce(createStatus(2));
  await store.rebuildIndex(NOTES, 500, 50, 'manual', true);
  return store;
}

describe('Knowledge Copilot index rebuild consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    mocks.settingsStore = createSettingsStore();
    mocks.service.initialize.mockResolvedValue({ success: true });
    mocks.service.clearIndex.mockResolvedValue({ success: true });
    mocks.service.deleteNoteIndex.mockResolvedValue({ success: true });
  });

  it('falls back to a full rebuild when LanceDB data is missing', async () => {
    const store = await establishHealthyIndex();
    mocks.service.clearIndex.mockClear();
    mocks.service.indexNote.mockClear();
    mocks.service.getStatus.mockReset();
    mocks.service.getStatus
      .mockResolvedValueOnce(createStatus(0))
      .mockResolvedValueOnce(createStatus(2));
    mocks.service.indexNote.mockResolvedValue({ success: true, chunksIndexed: 2 });

    await store.rebuildIndex(NOTES, 500, 50, 'manual', false);

    expect(mocks.service.clearIndex).toHaveBeenCalledOnce();
    expect(mocks.service.indexNote).toHaveBeenCalledOnce();
    expect(store.indexStatus.lastRebuildResult).toBe('success');
    expect(store.indexStatus.totalChunks).toBe(2);
  });

  it('keeps the healthy incremental path and skips unchanged notes', async () => {
    const store = await establishHealthyIndex();
    mocks.service.clearIndex.mockClear();
    mocks.service.indexNote.mockClear();
    mocks.service.getStatus.mockReset();
    mocks.service.getStatus
      .mockResolvedValueOnce(createStatus(2))
      .mockResolvedValueOnce(createStatus(2));

    await store.rebuildIndex(NOTES, 500, 50, 'manual', false);

    expect(mocks.service.clearIndex).not.toHaveBeenCalled();
    expect(mocks.service.indexNote).not.toHaveBeenCalled();
    expect(store.indexStatus.skippedNotes).toBe(1);
    expect(store.indexStatus.lastRebuildResult).toBe('success');
  });

  it('recovers when legacy signature metadata has no chunk count', async () => {
    const store = await establishHealthyIndex();
    delete mocks.settingsStore?.config.knowledgeCopilot.indexChunkCounts['note-1'];
    mocks.service.clearIndex.mockClear();
    mocks.service.indexNote.mockClear();
    mocks.service.getStatus.mockReset();
    mocks.service.getStatus
      .mockResolvedValueOnce(createStatus(0))
      .mockResolvedValueOnce(createStatus(2));
    mocks.service.indexNote.mockResolvedValue({ success: true, chunksIndexed: 2 });

    await store.rebuildIndex(NOTES, 500, 50, 'manual', false);

    expect(mocks.service.clearIndex).toHaveBeenCalledOnce();
    expect(mocks.service.indexNote).toHaveBeenCalledOnce();
    expect(mocks.settingsStore?.config.knowledgeCopilot.indexChunkCounts['note-1']).toBe(2);
  });

  it('removes failed-note metadata so a later fast rebuild can retry it', async () => {
    const store = await establishHealthyIndex();
    mocks.service.clearIndex.mockClear();
    mocks.service.indexNote.mockReset();
    mocks.service.indexNote.mockResolvedValue({ success: false, error: 'Embedding failed' });
    mocks.service.getStatus.mockReset();
    mocks.service.getStatus
      .mockResolvedValueOnce(createStatus(0))
      .mockResolvedValueOnce(createStatus(0));

    await store.rebuildIndex(NOTES, 500, 50, 'manual', false);

    expect(store.indexStatus.lastRebuildResult).toBe('failure');
    expect(mocks.settingsStore?.config.knowledgeCopilot.indexSignatures['note-1']).toBeUndefined();
    expect(mocks.settingsStore?.config.knowledgeCopilot.indexChunkCounts['note-1']).toBeUndefined();
  });

  it('reports failure when the verified chunk count does not match the rebuild result', async () => {
    const store = await establishHealthyIndex();
    mocks.service.indexNote.mockReset();
    mocks.service.indexNote.mockResolvedValue({ success: true, chunksIndexed: 2 });
    mocks.service.getStatus.mockReset();
    mocks.service.getStatus
      .mockResolvedValueOnce(createStatus(0))
      .mockResolvedValueOnce(createStatus(0));

    await expect(store.rebuildIndex(NOTES, 500, 50, 'manual', false)).rejects.toThrow(
      'Knowledge index chunk count mismatch',
    );
    expect(store.indexStatus.lastRebuildResult).toBe('failure');
    expect(store.indexStatus.error).toContain('Knowledge index chunk count mismatch');
  });
});
