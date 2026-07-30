import { settingsService } from './settings.service.js';
import { $t } from '../utils/i18n.js';
import {
  AI_WRITING_DEFAULTS,
  type AiWritingScenario,
  type AiWritingStyle,
  isValidAiWritingScenario,
  isValidAiWritingStyle,
} from '../../shared/ai.constants.js';
import type { AiProvider } from '../../shared/ai-provider.constants.js';

interface AiSourceConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  aiModel: string;
  capabilities: string[];
  provider: AiProvider;
}

interface AiAssistantSettings {
  enabled: boolean;
  sourceId: string;
  model: string;
  systemPrompt: string;
  writingStyle: unknown;
  writingScenario: unknown;
}

interface KnowledgeCopilotSettings {
  enabled: boolean;
  embeddingSourceId: string;
  embeddingModel: string;
  askChatSourceId: string;
  askChatModel: string;
  agentChatSourceId: string;
  agentChatModel: string;
  rerankerSourceId: string;
  rerankerModel: string;
  topK: number;
  similarityThreshold: number;
}

interface NormalizedAppConfig {
  language: string;
  noteStoragePath: string;
  aiSources: AiSourceConfig[];
  aiAssistant: AiAssistantSettings;
  knowledgeCopilot: KnowledgeCopilotSettings;
}

interface ResolvedEmbeddingConfig {
  provider: AiProvider;
  baseUrl: string;
  endpoint: string;
  apiKey: string;
  model: string;
}

interface ResolvedChatConfig {
  provider: AiProvider;
  baseUrl: string;
  endpoint: string;
  apiKey: string;
  model: string;
}

interface ResolvedRerankerConfig {
  provider: AiProvider;
  baseUrl: string;
  sourceId: string;
  endpoint: string;
  apiKey: string;
  model: string;
}

interface ResolvedAssistantConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  uiLanguage: string;
  customSystemPrompt: string;
  writingStyle: AiWritingStyle;
  writingScenario: AiWritingScenario;
}

interface ResolvedKnowledgeCopilotConfig {
  uiLanguage: string;
  workspaceRoot: string;
  knowledgeCopilot: Pick<KnowledgeCopilotSettings, 'topK' | 'similarityThreshold'>;
  embeddingConfig: ResolvedEmbeddingConfig;
  askChatConfig: ResolvedChatConfig | null;
  agentChatConfig: ResolvedChatConfig | null;
  rerankerConfig: ResolvedRerankerConfig | null;
}

type LoadedAppConfig = Awaited<ReturnType<typeof settingsService.loadConfig>>;

function selectAiConfig(config: LoadedAppConfig): NormalizedAppConfig {
  return {
    language: config.general.language,
    noteStoragePath: config.noteStorage.path,
    aiSources: config.aiSources.sources,
    aiAssistant: config.aiAssistant,
    knowledgeCopilot: config.knowledgeCopilot,
  };
}

function requireConfiguredSource(
  aiSources: AiSourceConfig[],
  sourceId: string,
  errorMessage: string,
): AiSourceConfig {
  if (!sourceId) {
    throw new Error(errorMessage);
  }

  const source = aiSources.find((item) => item.id === sourceId);
  if (!source) {
    throw new Error(errorMessage);
  }

  return source;
}

function resolveModel(preferredModel: string, fallbackModel: string, errorMessage: string): string {
  const model = preferredModel || fallbackModel || '';
  if (!model) {
    throw new Error(errorMessage);
  }
  return model;
}

function resolveAssistantPromptSettings(aiAssistant: AiAssistantSettings): {
  customSystemPrompt: string;
  writingStyle: AiWritingStyle;
  writingScenario: AiWritingScenario;
} {
  const customSystemPrompt = aiAssistant.systemPrompt.trim();
  const writingStyleCandidate = aiAssistant.writingStyle;
  const writingScenarioCandidate = aiAssistant.writingScenario;
  const writingStyle = isValidAiWritingStyle(writingStyleCandidate)
    ? writingStyleCandidate
    : AI_WRITING_DEFAULTS.STYLE;
  const writingScenario = isValidAiWritingScenario(writingScenarioCandidate)
    ? writingScenarioCandidate
    : AI_WRITING_DEFAULTS.SCENARIO;

  return {
    customSystemPrompt,
    writingStyle,
    writingScenario,
  };
}

function supportsCapability(source: AiSourceConfig, capability: string): boolean {
  return source.capabilities.length === 0 || source.capabilities.includes(capability);
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

function resolveSourceBaseUrl(source: AiSourceConfig): string {
  return normalizeBaseUrl(source.baseUrl);
}

function resolveSourceEndpoint(source: AiSourceConfig, capability: 'chat' | 'embedding' | 'reranker'): string {
  const baseUrl = normalizeBaseUrl(source.baseUrl);
  if (!baseUrl) {
    throw new Error(`Missing ${capability} base URL`);
  }

  if (capability === 'chat') {
    return `${baseUrl}/chat/completions`;
  }

  if (capability === 'embedding') {
    return `${baseUrl}/embeddings`;
  }

  return `${baseUrl}/rerank`;
}

function requireConfiguredSourceWithCapability(
  aiSources: AiSourceConfig[],
  sourceId: string,
  capability: string,
  errorMessage: string,
): AiSourceConfig {
  const source = requireConfiguredSource(aiSources, sourceId, errorMessage);
  if (!supportsCapability(source, capability)) {
    throw new Error(errorMessage);
  }

  return source;
}

export const aiConfigService = {
  async loadAppConfig(): Promise<NormalizedAppConfig> {
    const config = await settingsService.loadConfig();
    return selectAiConfig(config);
  },

  async resolveAssistantConfig(): Promise<ResolvedAssistantConfig> {
    const config = await this.loadAppConfig();
    const aiAssistant = config.aiAssistant;
    const promptSettings = resolveAssistantPromptSettings(aiAssistant);

    if (!aiAssistant.enabled) {
      throw new Error($t('aiAssistant.error.disabled', 'AI Assistant is disabled'));
    }

    const source = requireConfiguredSourceWithCapability(
      config.aiSources,
      aiAssistant.sourceId,
      'chat',
      $t('aiAssistant.error.sourceNotFound', 'AI source not found'),
    );
    const model = resolveModel(
      aiAssistant.model,
      source.aiModel,
      $t('aiAssistant.error.noModelConfigured', 'No model configured'),
    );

    return {
      endpoint: resolveSourceEndpoint(source, 'chat'),
      apiKey: source.apiKey,
      model,
      uiLanguage: config.language,
      customSystemPrompt: promptSettings.customSystemPrompt,
      writingStyle: promptSettings.writingStyle,
      writingScenario: promptSettings.writingScenario,
    };
  },

  async resolveKnowledgeCopilotConfig(): Promise<ResolvedKnowledgeCopilotConfig> {
    const config = await this.loadAppConfig();
    const knowledgeCopilot = config.knowledgeCopilot;

    if (!knowledgeCopilot.enabled) {
      throw new Error('Knowledge Copilot is disabled in settings');
    }

    if (!config.noteStoragePath) {
      throw new Error('No workspace root configured');
    }

    const embeddingSource = requireConfiguredSourceWithCapability(
      config.aiSources,
      knowledgeCopilot.embeddingSourceId,
      'embedding',
      'Embedding source not found',
    );

    const askChatSource = knowledgeCopilot.askChatSourceId
      ? config.aiSources.find((item) => item.id === knowledgeCopilot.askChatSourceId && supportsCapability(item, 'chat')) ?? null
      : null;
    const agentChatSource = knowledgeCopilot.agentChatSourceId
      ? config.aiSources.find((item) => item.id === knowledgeCopilot.agentChatSourceId && supportsCapability(item, 'chat')) ?? null
      : null;

    const rerankerSource = knowledgeCopilot.rerankerSourceId
      ? config.aiSources.find((item) => item.id === knowledgeCopilot.rerankerSourceId && supportsCapability(item, 'reranker')) ?? null
      : null;
    return {
      uiLanguage: config.language,
      workspaceRoot: config.noteStoragePath,
      knowledgeCopilot: {
        topK: knowledgeCopilot.topK,
        similarityThreshold: knowledgeCopilot.similarityThreshold,
      },
      embeddingConfig: {
        provider: embeddingSource.provider,
        baseUrl: resolveSourceBaseUrl(embeddingSource),
        endpoint: resolveSourceEndpoint(embeddingSource, 'embedding'),
        apiKey: embeddingSource.apiKey,
        model: resolveModel(knowledgeCopilot.embeddingModel, embeddingSource.aiModel, 'Embedding model not specified'),
      },
      askChatConfig: askChatSource
          ? {
            provider: askChatSource.provider,
            baseUrl: resolveSourceBaseUrl(askChatSource),
            endpoint: resolveSourceEndpoint(askChatSource, 'chat'),
            apiKey: askChatSource.apiKey,
            model: resolveModel(knowledgeCopilot.askChatModel, askChatSource.aiModel, 'No Ask chat model configured'),
          }
        : null,
      agentChatConfig: agentChatSource
          ? {
            provider: agentChatSource.provider,
            baseUrl: resolveSourceBaseUrl(agentChatSource),
            endpoint: resolveSourceEndpoint(agentChatSource, 'chat'),
            apiKey: agentChatSource.apiKey,
            model: resolveModel(knowledgeCopilot.agentChatModel, agentChatSource.aiModel, 'No Agent chat model configured'),
          }
        : null,
      rerankerConfig: rerankerSource
        ? {
            provider: rerankerSource.provider,
            baseUrl: resolveSourceBaseUrl(rerankerSource),
            sourceId: rerankerSource.id,
            endpoint: resolveSourceEndpoint(rerankerSource, 'reranker'),
            apiKey: rerankerSource.apiKey,
            model: resolveModel(knowledgeCopilot.rerankerModel, rerankerSource.aiModel, 'No reranker model configured'),
          }
        : null,
    };
  },
};
