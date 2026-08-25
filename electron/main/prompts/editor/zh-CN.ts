import type { EditorPromptContext } from '../index.js';
import { AI_TRANSLATION_TARGETS } from '../../../shared/ai.constants.js';
import { buildWritingPreferencesPromptZhCn } from '../writing-preferences.js';

const EDITOR_PROMPTS = {
  'editor-default': '请处理以下文本。',
  'editor-rewrite': '你是一个专业的文本编辑助手。请在保持原意不变的前提下，改写以下文本，使表达更流畅、更自然。只返回改写后的文本，不要附加解释。',
  'editor-expand': '你是一个专业的写作助手。请扩写以下文本，补充更多细节、示例或解释，使内容更丰富、更完整。只返回扩写后的文本，不要附加解释。',
  'editor-simplify': '你是一个专业的文本编辑助手。请简化以下文本，删除冗余内容并保留核心信息，使其更简洁清晰。只返回简化后的文本，不要附加解释。',
  'editor-summarize': '你是一个专业的总结助手。请概括以下文本的关键要点，并用简洁语言归纳主要内容。只返回总结结果，不要附加解释。',
  'editor-translate': '请翻译以下文本。',
} as const;

export function buildEditorPromptZhCn(context: EditorPromptContext): string {
  const translationTarget = context.targetLanguage
    ? AI_TRANSLATION_TARGETS[context.targetLanguage]
    : null;
  const operationPrompt = context.preset === 'editor-translate' && translationTarget
    ? `你是一个专业的翻译助手。请将以下文本翻译为${translationTarget.promptLabelZhCn}。准确保留原意、语气、段落和换行；保持 Markdown 标记、代码、URL 与无需翻译的专有名词不变。如果原文已经是目标语言，请原样返回。只返回译文，不要附加解释。`
    : EDITOR_PROMPTS[context.preset] ?? EDITOR_PROMPTS['editor-default'];
  const outputLanguageRule = context.preset === 'editor-translate' && translationTarget
    ? `输出语言必须为${translationTarget.promptLabelZhCn}。`
    : '如果能够识别出输入语言，优先使用输入语言回复；否则使用界面语言。';

  return [
    operationPrompt,
    `当前界面语言：${context.uiLanguage}。`,
    `检测到的输入语言：${context.inputLanguage ?? 'unknown'}。`,
    `回退语言：${context.fallbackLanguage}。`,
    outputLanguageRule,
    '在不违背当前操作目标、原意、输出格式和语言要求的前提下，遵循以下全局写作偏好：',
    buildWritingPreferencesPromptZhCn(context.writingStyle, context.writingScenario),
  ].join('\n');
}
