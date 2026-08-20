import { ref, type Ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppSettings } from '../../src/renderer/features/settings/store/settings.store';
import {
  sanitizeWorkbenchSettings,
  type WorkbenchSettings,
} from '../../src/renderer/features/workbench/constants/workbench.constants';

interface SettingsStoreMock {
  config: Ref<AppSettings>;
  persistence: {
    save: ReturnType<typeof vi.fn>;
  };
}

const mocks = vi.hoisted(() => ({
  settingsStore: null as SettingsStoreMock | null,
}));

vi.mock('@renderer/features/settings', () => ({
  useSettingsStore: () => mocks.settingsStore,
}));

vi.mock('@renderer/features/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { useWorkbenchStore } from '../../src/renderer/features/workbench/store/workbench.store';

function createSettings(): WorkbenchSettings {
  return sanitizeWorkbenchSettings({});
}

describe('Workbench concurrent persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const config = ref({ workbench: createSettings() } as unknown as AppSettings);
    const save = vi.fn(async (payload: { workbench: WorkbenchSettings }) => {
      config.value = { ...config.value, workbench: payload.workbench };
      await Promise.resolve();
      return config.value;
    });
    mocks.settingsStore = {
      config,
      persistence: { save },
    };
  });

  it('preserves drafts recorded concurrently in different conversations', async () => {
    const store = useWorkbenchStore();

    await Promise.all([
      store.recordQuestion({ query: 'First', threadId: 'thread-1', askedAt: 1 }),
      store.recordQuestion({ query: 'Second', threadId: 'thread-2', askedAt: 2 }),
    ]);

    const threads = mocks.settingsStore?.config.value.workbench.conversationThreads ?? [];
    expect(threads.map((thread) => thread.id).sort()).toEqual(['thread-1', 'thread-2']);
    expect(threads.every((thread) => thread.questions.length === 1)).toBe(true);
  });
});
