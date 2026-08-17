import { readonly, ref } from 'vue';
import { useAppShellStore } from '@renderer/app/store/appShell.store';

export type SearchMode = 'semantic';

export interface OpenSearchViewOptions {
  query?: string;
  threadId?: string;
  mode?: SearchMode;
  run?: boolean;
}

export interface SearchViewRequest {
  id: number;
  query: string;
  threadId?: string;
  mode: SearchMode;
  run: boolean;
}

export interface QuickSearchRequest {
  id: number;
  selectAll: boolean;
}

export interface KnowledgeConversationDraftState {
  id: string;
  createdAt: number;
}

export interface RequestQuickSearchOptions {
  selectAll?: boolean;
}

const searchViewRequest = ref<SearchViewRequest>({
  id: 0,
  query: '',
  mode: 'semantic',
  run: false,
});
const lastKnowledgeConversationThreadId = ref<string | null>(null);
const activeKnowledgeConversationThreadId = ref<string | null>(null);
const knowledgeConversationDraft = ref<KnowledgeConversationDraftState | null>(null);

const quickSearchRequest = ref<QuickSearchRequest>({
  id: 0,
  selectAll: true,
});

export function useSearch() {
  const openSearchView = async (options: OpenSearchViewOptions = {}): Promise<void> => {
    const query = options.query ?? '';
    searchViewRequest.value = {
      id: searchViewRequest.value.id + 1,
      query,
      threadId: options.threadId?.trim() || undefined,
      mode: options.mode ?? 'semantic',
      run: options.run ?? Boolean(query.trim()),
    };

    await useAppShellStore().setActiveMainView('search');
  };

  const requestFocusQuickSearch = (options: RequestQuickSearchOptions = {}): void => {
    quickSearchRequest.value = {
      id: quickSearchRequest.value.id + 1,
      selectAll: options.selectAll ?? true,
    };
  };

  const rememberKnowledgeConversationThread = (threadId?: string, isDraft = false): void => {
    const normalizedThreadId = threadId?.trim() || null;
    activeKnowledgeConversationThreadId.value = normalizedThreadId;
    if (normalizedThreadId && !isDraft) {
      lastKnowledgeConversationThreadId.value = normalizedThreadId;
    }
  };

  const setKnowledgeConversationDraft = (draft: KnowledgeConversationDraftState | null): void => {
    knowledgeConversationDraft.value = draft;
  };

  const forgetKnowledgeConversationThread = (threadId: string): void => {
    const normalizedThreadId = threadId.trim();
    if (activeKnowledgeConversationThreadId.value === normalizedThreadId) {
      activeKnowledgeConversationThreadId.value = null;
    }
    if (lastKnowledgeConversationThreadId.value === normalizedThreadId) {
      lastKnowledgeConversationThreadId.value = null;
    }
    if (knowledgeConversationDraft.value?.id === normalizedThreadId) {
      knowledgeConversationDraft.value = null;
    }
  };

  return {
    searchViewRequest: readonly(searchViewRequest),
    lastKnowledgeConversationThreadId: readonly(lastKnowledgeConversationThreadId),
    activeKnowledgeConversationThreadId: readonly(activeKnowledgeConversationThreadId),
    knowledgeConversationDraft: readonly(knowledgeConversationDraft),
    quickSearchRequest: readonly(quickSearchRequest),
    openSearchView,
    rememberKnowledgeConversationThread,
    setKnowledgeConversationDraft,
    forgetKnowledgeConversationThread,
    requestFocusQuickSearch,
  };
}
