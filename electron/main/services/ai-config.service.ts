import { settingsService } from './settings.service.js';
import { $t } from '../utils/i18n.js';
import {
  AI_WRITING_DEFAULTS,
  type AiWritingScenario,
  type AiWritingStyle,
  isValidAiWritingScenario,
  isValidAiWritingStyle,
} from '../../shared/ai.constants.js';
import {
  resolveAiSourceModel,
  type AiCapability,
  type AiCapabilityModelMap,
  type AiProvider,
} from '../../shared/ai-provider.constants.js';
import { isBuiltInAiSourceId } from '../../shared/built-in-ai.constants.js';
import { builtInAiService } from './built-in-ai.service.js';

interface AiSourceConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  aiModel: string;
  capabilityModels?: AiCapabilityModelMap;
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
  provider: AiProvider;
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

function supportsCapability(source: AiSourceConfig, capability: AiCapability): boolean {
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
  capability: AiCapability,
  errorMessage: string,
): AiSourceConfig {
  const source = requireConfiguredSource(aiSources, sourceId, errorMessage);
  if (!supportsCapability(source, capability)) {
    throw new Error(errorMessage);
  }

  return source;
}

async function resolveSourceRequest(
  source: AiSourceConfig,
  capability: AiCapability,
  preferredModel: string,
  errorMessage: string,
): Promise<ResolvedEmbeddingConfig> {
  if (isBuiltInAiSourceId(source.id)) {
    return await builtInAiService.resolveRequest(capability);
  }

  return {
    provider: source.provider,
    baseUrl: resolveSourceBaseUrl(source),
    endpoint: resolveSourceEndpoint(source, capability),
    apiKey: source.apiKey,
    model: resolveModel(preferredModel, resolveAiSourceModel(source, capability), errorMessage),
  };
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
      throw new Error($t('aiAssistant.error.disabled'));
    }

    const source = requireConfiguredSourceWithCapability(
      config.aiSources,
      aiAssistant.sourceId,
      'chat',
      $t('aiAssistant.error.sourceNotFound'),
    );
    const requestConfig = await resolveSourceRequest(
      source,
      'chat',
      aiAssistant.model,
      $t('aiAssistant.error.noModelConfigured'),
    );

    return {
      provider: requestConfig.provider,
      endpoint: requestConfig.endpoint,
      apiKey: requestConfig.apiKey,
      model: requestConfig.model,
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
    const [embeddingConfig, askChatConfig, agentChatConfig, rerankerRequestConfig] = await Promise.all([
      resolveSourceRequest(
        embeddingSource,
        'embedding',
        knowledgeCopilot.embeddingModel,
        'Embedding model not specified',
      ),
      askChatSource
        ? resolveSourceRequest(
          askChatSource,
          'chat',
          knowledgeCopilot.askChatModel,
          'No Ask chat model configured',
        )
        : Promise.resolve(null),
      agentChatSource
        ? resolveSourceRequest(
          agentChatSource,
          'chat',
          knowledgeCopilot.agentChatModel,
          'No Agent chat model configured',
        )
        : Promise.resolve(null),
      rerankerSource
        ? resolveSourceRequest(
          rerankerSource,
          'reranker',
          knowledgeCopilot.rerankerModel,
          'No reranker model configured',
        )
        : Promise.resolve(null),
    ]);

    return {
      uiLanguage: config.language,
      workspaceRoot: config.noteStoragePath,
      knowledgeCopilot: {
        topK: knowledgeCopilot.topK,
        similarityThreshold: knowledgeCopilot.similarityThreshold,
      },
      embeddingConfig,
      askChatConfig,
      agentChatConfig,
      rerankerConfig: rerankerSource && rerankerRequestConfig
        ? {
            ...rerankerRequestConfig,
            sourceId: rerankerSource.id,
          }
        : null,
    };
  },
};
