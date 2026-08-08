import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import { BaseDocumentCompressor } from '@langchain/core/retrievers/document_compressors';
import type { DocumentInterface } from '@langchain/core/documents';
import { AI_PROVIDERS, type AiProvider } from '../../shared/ai-provider.constants.js';
import { getKnowledgeCopilotRebuildConcurrencyMax } from '../../shared/knowledge-copilot.constants.js';
import { remoteAiService } from './remote-ai.service.js';
import { builtInAiService } from './built-in-ai.service.js';
import { loggerService } from './log/logger.service.js';

const logger = loggerService.createLogger('Main:AiProviderService');

export interface AiProviderModelConfig {
  provider: AiProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
}

class OpenAiCompatibleReranker extends BaseDocumentCompressor {
  constructor(private readonly config: AiProviderModelConfig) {
    super();
  }

  async compressDocuments(documents: DocumentInterface[], query: string): Promise<DocumentInterface[]> {
    const ranked = await remoteAiService.rerank({
      endpoint: remoteAiService.resolveCapabilityEndpoint(this.config.baseUrl, 'reranker'),
      apiKey: this.config.apiKey,
      model: this.config.model,
      query,
      documents: documents.map((document) => document.pageContent),
    });

    const results: DocumentInterface[] = [];
    for (const item of ranked) {
      const document = documents[item.index];
      if (!document) continue;
      results.push({
        ...document,
        metadata: { ...document.metadata, relevanceScore: item.score },
      });
    }
    return results;
  }
}

function isOpenAiCompatibleProvider(provider: AiProvider): boolean {
  return provider === AI_PROVIDERS.OPENAI
    || provider === AI_PROVIDERS.SNAPTIUM
    || provider === AI_PROVIDERS.AZURE_OPENAI
    || provider === AI_PROVIDERS.OPENAI_COMPATIBLE
    || provider === AI_PROVIDERS.FIREWORKS
    || provider === AI_PROVIDERS.SILICONFLOW
    || provider === AI_PROVIDERS.OPENROUTER
    || provider === AI_PROVIDERS.DEEPSEEK
    || provider === AI_PROVIDERS.ALIBABA_CLOUD_MODEL_STUDIO
    || provider === AI_PROVIDERS.VOLCENGINE
    || provider === AI_PROVIDERS.KIMI
    || provider === AI_PROVIDERS.ZHIPU
    || provider === AI_PROVIDERS.GROK;
}

function requireApiKey(config: AiProviderModelConfig): string {
  if (!config.apiKey && config.provider !== AI_PROVIDERS.OLLAMA) {
    throw new Error('Missing AI provider API key');
  }
  return config.apiKey;
}

async function fetchBuiltInAi(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return builtInAiService.fetch(input, init);
}

export function createProviderChatModel(config: AiProviderModelConfig): BaseChatModel {
  const apiKey = requireApiKey(config);
  if (isOpenAiCompatibleProvider(config.provider)) {
    return new ChatOpenAI({
      apiKey,
      model: config.model,
      temperature: 0,
      maxRetries: 2,
      configuration: {
        baseURL: config.baseUrl,
        ...(config.provider === AI_PROVIDERS.SNAPTIUM ? { fetch: fetchBuiltInAi } : {}),
      },
    });
  }

  if (config.provider === AI_PROVIDERS.GOOGLE_GEMINI) {
    return new ChatGoogleGenerativeAI({ apiKey, model: config.model, temperature: 0, baseUrl: config.baseUrl });
  }

  if (config.provider === AI_PROVIDERS.OLLAMA) {
    return new ChatOllama({ model: config.model, baseUrl: config.baseUrl, temperature: 0 });
  }

  throw new Error(`Provider ${config.provider} does not support chat models`);
}

export function createProviderEmbeddings(config: AiProviderModelConfig): Embeddings {
  const apiKey = requireApiKey(config);
  const maxConcurrency = getKnowledgeCopilotRebuildConcurrencyMax(config.provider);
  logger.debug('Creating embeddings client', {
    provider: config.provider,
    maxConcurrency,
  });

  if (isOpenAiCompatibleProvider(config.provider)) {
    return new OpenAIEmbeddings({
      apiKey,
      model: config.model,
      maxConcurrency,
      configuration: {
        baseURL: config.baseUrl,
        ...(config.provider === AI_PROVIDERS.SNAPTIUM ? { fetch: fetchBuiltInAi } : {}),
      },
    });
  }

  if (config.provider === AI_PROVIDERS.GOOGLE_GEMINI) {
    return new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: config.model,
      baseUrl: config.baseUrl,
      maxConcurrency,
    });
  }

  if (config.provider === AI_PROVIDERS.OLLAMA) {
    return new OllamaEmbeddings({
      model: config.model,
      baseUrl: config.baseUrl,
      maxConcurrency,
    });
  }

  throw new Error(`Provider ${config.provider} does not support embeddings`);
}

export function createProviderReranker(config: AiProviderModelConfig): BaseDocumentCompressor {
  requireApiKey(config);
  if (config.provider === AI_PROVIDERS.SILICONFLOW
    || config.provider === AI_PROVIDERS.FIREWORKS
    || config.provider === AI_PROVIDERS.SNAPTIUM
    || config.provider === AI_PROVIDERS.OPENAI_COMPATIBLE) {
    return new OpenAiCompatibleReranker(config);
  }

  throw new Error(`Provider ${config.provider} does not support reranking`);
}
