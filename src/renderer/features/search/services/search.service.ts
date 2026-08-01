import { electronApi } from '@renderer/core/bridge/electronApi';
import { createLogger } from '@renderer/features/logger';
import { getErrorMessage } from '@shared/utils/error.utils';

export const QUICK_SEARCH_HISTORY_LIMIT = 10;
export const QUICK_SEARCH_HISTORY_STORAGE_KEY = 'snaptium.quick-search-history.v1';

export interface QuickSearchHistoryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface QuickSearchHistoryService {
  list(): string[];
  record(query: string): string[];
  remove(query: string): string[];
  clear(): string[];
}

type StorageProvider = () => QuickSearchHistoryStorage | null;

const quickSearchHistoryLogger = createLogger('QuickSearchHistory');

export function normalizeQuickSearchHistory(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const history: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }

    const query = item.trim();
    if (!query || history.includes(query)) {
      continue;
    }

    history.push(query);
    if (history.length === QUICK_SEARCH_HISTORY_LIMIT) {
      break;
    }
  }

  return history;
}

function getBrowserStorage(): QuickSearchHistoryStorage | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export function createQuickSearchHistoryService(
  getStorage: StorageProvider = getBrowserStorage,
): QuickSearchHistoryService {
  let history: string[] | null = null;

  function reportStorageError(operation: string, error: unknown): void {
    quickSearchHistoryLogger.warn(`Failed to ${operation} quick-search history`, getErrorMessage(error));
  }

  function loadHistory(): string[] {
    if (history) {
      return history;
    }

    try {
      const rawHistory = getStorage()?.getItem(QUICK_SEARCH_HISTORY_STORAGE_KEY);
      if (!rawHistory) {
        history = [];
        return history;
      }

      const parsedHistory: unknown = JSON.parse(rawHistory);
      history = normalizeQuickSearchHistory(parsedHistory);
    } catch (error: unknown) {
      reportStorageError('load', error);
      history = [];
    }

    return history;
  }

  function persistHistory(): void {
    try {
      getStorage()?.setItem(QUICK_SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(loadHistory()));
    } catch (error: unknown) {
      reportStorageError('save', error);
    }
  }

  return {
    list(): string[] {
      return [...loadHistory()];
    },

    record(query: string): string[] {
      const normalizedQuery = query.trim();
      if (!normalizedQuery) {
        return [...loadHistory()];
      }

      history = normalizeQuickSearchHistory([
        normalizedQuery,
        ...loadHistory().filter((item) => item !== normalizedQuery),
      ]);
      persistHistory();
      return [...history];
    },

    remove(query: string): string[] {
      const normalizedQuery = query.trim();
      history = loadHistory().filter((item) => item !== normalizedQuery);
      persistHistory();
      return [...history];
    },

    clear(): string[] {
      history = [];
      try {
        getStorage()?.removeItem(QUICK_SEARCH_HISTORY_STORAGE_KEY);
      } catch (error: unknown) {
        reportStorageError('clear', error);
      }
      return [];
    },
  };
}

const quickSearchHistoryService = createQuickSearchHistoryService();

export interface SearchMatch {
  line: number;
  column: number;
  text: string;
  matchStart: number;
  matchEnd: number;
}

export interface SearchResult {
  id: string;
  contentId: string;
  title: string;
  matches: SearchMatch[];
  titleMatch: boolean;
  score?: number; // Added score for orchestration
}

/**
 * Search Service - Orchestration Layer
 * Handles search logic and result processing.
 */
export const searchService = {
  quickHistory: quickSearchHistoryService,

  /**
   * Search notes and process results (Orchestration)
   */
  async searchNotes(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    const results = await electronApi.search.searchNotes(query);

    // Orchestration: Sort results by title match priority and number of matches
    return results.sort((a, b) => {
      if (a.titleMatch && !b.titleMatch) return -1;
      if (!a.titleMatch && b.titleMatch) return 1;
      return b.matches.length - a.matches.length;
    });
  },
};
