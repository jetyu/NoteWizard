export const AI_CAPABILITIES = {
  CHAT: 'chat',
  EMBEDDING: 'embedding',
  RERANKER: 'reranker',
} as const satisfies Record<string, string>;

export type AiCapability = (typeof AI_CAPABILITIES)[keyof typeof AI_CAPABILITIES];

export type AiCapabilityModelMap = Partial<Record<AiCapability, string>>;

export interface AiSourceModelDescriptor {
  aiModel: string;
  capabilityModels?: AiCapabilityModelMap;
}

export const AI_PROVIDERS = {
  SNAPTIUM: 'snaptium',
  OPENAI: 'openai',
  AZURE_OPENAI: 'azure-openai',
  OPENAI_COMPATIBLE: 'openai-compatible',
  FIREWORKS: 'fireworks',
  SILICONFLOW: 'siliconflow',
  GOOGLE_GEMINI: 'google-gemini',
  OLLAMA: 'ollama',
  OPENROUTER: 'openrouter',
  DEEPSEEK: 'deepseek',
  ALIBABA_CLOUD_MODEL_STUDIO: 'alibaba-cloud-model-studio',
  VOLCENGINE: 'volcengine',
  KIMI: 'kimi',
  ZHIPU: 'zhipu',
  GROK: 'grok',
  ANTHROPIC: 'anthropic',
} as const satisfies Record<string, string>;

export type AiProvider = (typeof AI_PROVIDERS)[keyof typeof AI_PROVIDERS];

export const AI_PROVIDER_DEFAULT_BASE_URLS = {
  [AI_PROVIDERS.SNAPTIUM]: '',
  [AI_PROVIDERS.OPENAI]: 'https://api.openai.com/v1',
  [AI_PROVIDERS.AZURE_OPENAI]: '',
  [AI_PROVIDERS.OPENAI_COMPATIBLE]: '',
  [AI_PROVIDERS.FIREWORKS]: 'https://api.fireworks.ai/inference/v1',
  [AI_PROVIDERS.SILICONFLOW]: 'https://api.siliconflow.cn/v1',
  [AI_PROVIDERS.GOOGLE_GEMINI]: 'https://generativelanguage.googleapis.com',
  [AI_PROVIDERS.OLLAMA]: 'http://127.0.0.1:11434',
  [AI_PROVIDERS.OPENROUTER]: 'https://openrouter.ai/api/v1',
  [AI_PROVIDERS.DEEPSEEK]: 'https://api.deepseek.com',
  [AI_PROVIDERS.ALIBABA_CLOUD_MODEL_STUDIO]: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  [AI_PROVIDERS.VOLCENGINE]: 'https://ark.cn-beijing.volces.com/api/v3',
  [AI_PROVIDERS.KIMI]: 'https://api.moonshot.ai/v1',
  [AI_PROVIDERS.ZHIPU]: 'https://open.bigmodel.cn/api/paas/v4',
  [AI_PROVIDERS.GROK]: 'https://api.x.ai/v1',
  [AI_PROVIDERS.ANTHROPIC]: 'https://api.anthropic.com',
} as const satisfies Record<AiProvider, string>;

export const AI_PROVIDER_CAPABILITIES = {
  [AI_PROVIDERS.SNAPTIUM]: ['chat', 'embedding', 'reranker'],
  [AI_PROVIDERS.OPENAI]: ['chat', 'embedding'],
  [AI_PROVIDERS.AZURE_OPENAI]: ['chat', 'embedding'],
  [AI_PROVIDERS.OPENAI_COMPATIBLE]: ['chat', 'embedding', 'reranker'],
  [AI_PROVIDERS.FIREWORKS]: ['chat', 'embedding', 'reranker'],
  [AI_PROVIDERS.SILICONFLOW]: ['chat', 'embedding', 'reranker'],
  [AI_PROVIDERS.GOOGLE_GEMINI]: ['chat', 'embedding'],
  [AI_PROVIDERS.OLLAMA]: ['chat', 'embedding'],
  [AI_PROVIDERS.OPENROUTER]: ['chat', 'embedding', 'reranker'],
  [AI_PROVIDERS.DEEPSEEK]: ['chat'],
  [AI_PROVIDERS.ALIBABA_CLOUD_MODEL_STUDIO]: ['chat'],
  [AI_PROVIDERS.VOLCENGINE]: ['chat'],
  [AI_PROVIDERS.KIMI]: ['chat'],
  [AI_PROVIDERS.ZHIPU]: ['chat'],
  [AI_PROVIDERS.GROK]: ['chat'],
  [AI_PROVIDERS.ANTHROPIC]: ['chat'],
} as const satisfies Record<AiProvider, readonly AiCapability[]>;

const AI_PROVIDER_SET = new Set<string>(Object.values(AI_PROVIDERS));

const AI_PROVIDER_BY_HOSTNAME = new Map<string, AiProvider>([
  ['newapi.snaptium.com', AI_PROVIDERS.SNAPTIUM],
  ['api.fireworks.ai', AI_PROVIDERS.FIREWORKS],
  ['api.siliconflow.cn', AI_PROVIDERS.SILICONFLOW],
  ['api.openai.com', AI_PROVIDERS.OPENAI],
  ['generativelanguage.googleapis.com', AI_PROVIDERS.GOOGLE_GEMINI],
  ['openrouter.ai', AI_PROVIDERS.OPENROUTER],
  ['api.deepseek.com', AI_PROVIDERS.DEEPSEEK],
  ['api.moonshot.ai', AI_PROVIDERS.KIMI],
  ['open.bigmodel.cn', AI_PROVIDERS.ZHIPU],
  ['api.x.ai', AI_PROVIDERS.GROK],
  ['api.anthropic.com', AI_PROVIDERS.ANTHROPIC],
]);

export function isAiProvider(value: unknown): value is AiProvider {
  return typeof value === 'string' && AI_PROVIDER_SET.has(value);
}

export function inferAiProvider(baseUrl: string): AiProvider {
  try {
    const parsedUrl = new URL(baseUrl.trim());
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return AI_PROVIDERS.OPENAI_COMPATIBLE;
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && parsedUrl.port === '11434') {
      return AI_PROVIDERS.OLLAMA;
    }

    const pathname = parsedUrl.pathname.replace(/\/+$/, '').toLowerCase();
    const isAzureOpenAiHost = hostname.endsWith('.openai.azure.com')
      || hostname.endsWith('.services.ai.azure.com');
    if (isAzureOpenAiHost && pathname.endsWith('/openai/v1')) {
      return AI_PROVIDERS.AZURE_OPENAI;
    }

    const isAlibabaCloudModelStudioHost = hostname === 'dashscope.aliyuncs.com'
      || hostname === 'dashscope-us.aliyuncs.com'
      || hostname === 'dashscope-intl.aliyuncs.com'
      || hostname.endsWith('.dashscope.aliyuncs.com')
      || hostname.endsWith('.maas.aliyuncs.com');
    if (isAlibabaCloudModelStudioHost) {
      return AI_PROVIDERS.ALIBABA_CLOUD_MODEL_STUDIO;
    }

    if (hostname.startsWith('ark.') && hostname.endsWith('.volces.com')) {
      return AI_PROVIDERS.VOLCENGINE;
    }

    return AI_PROVIDER_BY_HOSTNAME.get(hostname) ?? AI_PROVIDERS.OPENAI_COMPATIBLE;
  } catch {
    return AI_PROVIDERS.OPENAI_COMPATIBLE;
  }
}

export function getAiProviderCapabilities(provider: AiProvider): AiCapability[] {
  return [...AI_PROVIDER_CAPABILITIES[provider]];
}

export function resolveAiSourceModel(
  source: AiSourceModelDescriptor,
  capability: AiCapability,
): string {
  return source.capabilityModels?.[capability]?.trim() || source.aiModel.trim();
}
