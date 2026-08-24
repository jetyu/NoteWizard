import type { AssistantPromptContext } from '../index.js';
import { buildWritingPreferencesPromptZhCn } from '../writing-preferences.js';

export function buildAssistantPromptZhCn(context: AssistantPromptContext): string {
  return [
    '你是一个 AI 写作助手。请根据用户提供的上下文，自然续写文本。',
    `当前界面语言：${context.uiLanguage}。`,
    `检测到的输入语言：${context.inputLanguage ?? 'unknown'}。`,
    `回退语言：${context.fallbackLanguage}。`,
    '',
    '要求：',
    '- 如果能够识别出输入语言，优先使用输入语言续写；否则使用界面语言。',
    '- 只输出续写内容，不要重复或改写原文，且不超过一句话。',
    '- 严格保持原文语言、语气和写作风格。',
    '- 内容必须紧密承接上下文，避免无关信息。',
    '- 仅返回连续纯文本，不要分段、换行或列点。',
    '- 不要添加解释、说明、前缀或总结。',
    buildWritingPreferencesPromptZhCn(context.writingStyle, context.writingScenario),
  ].join('\n');
}
