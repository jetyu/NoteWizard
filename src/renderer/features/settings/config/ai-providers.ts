import { AI_PROVIDERS, type AiProvider } from '@shared/ai-provider.constants';
import openAiLogoUrl from '@assets/images/ai-providers/openai.svg';
import azureOpenAiLogoUrl from '@assets/images/ai-providers/azure.svg';
import openaiCompatibleLogoUrl from '@assets/images/ai-providers/openaiCompatible.svg';
import fireworksLogoUrl from '@assets/images/ai-providers/fireworks.svg';
import siliconFlowLogoUrl from '@assets/images/ai-providers/siliconflow.svg';
import geminiLogoUrl from '@assets/images/ai-providers/gemini.svg';
import ollamaLogoUrl from '@assets/images/ai-providers/ollama.svg';
import openRouterLogoUrl from '@assets/images/ai-providers/openrouter.svg';
import deepSeekLogoUrl from '@assets/images/ai-providers/deepseek.svg';
import alibabaCloudLogoUrl from '@assets/images/ai-providers/alibaba-cloud.svg';
import volcengineLogoUrl from '@assets/images/ai-providers/volcengine.svg';
import kimiLogoUrl from '@assets/images/ai-providers/kimi.svg';
import zhipuLogoUrl from '@assets/images/ai-providers/zhipu.svg';
import grokLogoUrl from '@assets/images/ai-providers/grok.svg';

export interface AiProviderPresentation {
  labelKey: string;
  logoUrl?: string;
}

export const AI_PROVIDER_PRESENTATIONS = {
  [AI_PROVIDERS.SILICONFLOW]: { labelKey: 'aiProvider.siliconflow', logoUrl: siliconFlowLogoUrl },
  [AI_PROVIDERS.OPENAI]: { labelKey: 'aiProvider.openai', logoUrl: openAiLogoUrl },
  [AI_PROVIDERS.AZURE_OPENAI]: { labelKey: 'aiProvider.azureOpenAI', logoUrl: azureOpenAiLogoUrl },
  [AI_PROVIDERS.OPENAI_COMPATIBLE]: { labelKey: 'aiProvider.openaiCompatible', logoUrl: openaiCompatibleLogoUrl },
  [AI_PROVIDERS.FIREWORKS]: { labelKey: 'aiProvider.fireworks', logoUrl: fireworksLogoUrl },
  [AI_PROVIDERS.GOOGLE_GEMINI]: { labelKey: 'aiProvider.googleGemini', logoUrl: geminiLogoUrl },
  [AI_PROVIDERS.OLLAMA]: { labelKey: 'aiProvider.ollama', logoUrl: ollamaLogoUrl },
  [AI_PROVIDERS.OPENROUTER]: { labelKey: 'aiProvider.openRouter', logoUrl: openRouterLogoUrl },
  [AI_PROVIDERS.DEEPSEEK]: { labelKey: 'aiProvider.deepSeek', logoUrl: deepSeekLogoUrl },
  [AI_PROVIDERS.ALIBABA_CLOUD_MODEL_STUDIO]: {
    labelKey: 'aiProvider.alibabaCloudModelStudio',
    logoUrl: alibabaCloudLogoUrl,
  },
  [AI_PROVIDERS.VOLCENGINE]: { labelKey: 'aiProvider.volcengine', logoUrl: volcengineLogoUrl },
  [AI_PROVIDERS.KIMI]: { labelKey: 'aiProvider.kimi', logoUrl: kimiLogoUrl },
  [AI_PROVIDERS.ZHIPU]: { labelKey: 'aiProvider.zhipu', logoUrl: zhipuLogoUrl },
  [AI_PROVIDERS.GROK]: { labelKey: 'aiProvider.grok', logoUrl: grokLogoUrl },
} as const satisfies Record<AiProvider, AiProviderPresentation>;

export const SELECTABLE_AI_PROVIDERS: AiProvider[] = [
  AI_PROVIDERS.SILICONFLOW,
  AI_PROVIDERS.OPENAI,
  AI_PROVIDERS.DEEPSEEK,
  AI_PROVIDERS.ALIBABA_CLOUD_MODEL_STUDIO,
  AI_PROVIDERS.VOLCENGINE,
  AI_PROVIDERS.KIMI,
  AI_PROVIDERS.ZHIPU,
  AI_PROVIDERS.GOOGLE_GEMINI,
  AI_PROVIDERS.GROK,
  AI_PROVIDERS.OLLAMA,
  AI_PROVIDERS.AZURE_OPENAI,
  AI_PROVIDERS.FIREWORKS,
  AI_PROVIDERS.OPENROUTER,
  AI_PROVIDERS.OPENAI_COMPATIBLE,
];

export function getAiProviderPresentation(provider: AiProvider): AiProviderPresentation {
  return AI_PROVIDER_PRESENTATIONS[provider];
}
