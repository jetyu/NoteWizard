export const AI_WRITING_STYLE = {
  CONCISE: 'concise',
  RIGOROUS: 'rigorous',
  PROFESSIONAL: 'professional',
  ACCESSIBLE: 'accessible',
  VIVID: 'vivid',
} as const;

export type AiWritingStyle = (typeof AI_WRITING_STYLE)[keyof typeof AI_WRITING_STYLE];

export const AI_WRITING_SCENARIO = {
  GENERAL: 'general-writing',
  TECHNICAL_DOCUMENT: 'technical-document',
  PRODUCT_DOCUMENT: 'product-document',
  SUMMARY_REPORT: 'summary-report',
  DAILY_RECORD: 'daily-record',
  CONTENT_CREATION: 'content-creation',
  OFFICIAL_WRITING: 'official-writing',
} as const;

export type AiWritingScenario = (typeof AI_WRITING_SCENARIO)[keyof typeof AI_WRITING_SCENARIO];

export const AI_WRITING_MODE = {
  FOCUS: 'focus',
  STANDARD: 'standard',
  AGGRESSIVE: 'aggressive',
} as const;

export type AiWritingMode = (typeof AI_WRITING_MODE)[keyof typeof AI_WRITING_MODE];

export const AI_COMPLETION_INTENT = {
  CONTINUE_SENTENCE: 'continue-sentence',
  CONTINUE_PARAGRAPH: 'continue-paragraph',
  BRIDGE_TEXT: 'bridge-text',
} as const;

export type AiCompletionIntent = (typeof AI_COMPLETION_INTENT)[keyof typeof AI_COMPLETION_INTENT];

export interface AiCompletionPromptContext {
  context: string;
  contextAfter?: string;
  noteTitle?: string;
  sectionHeading?: string;
  intent?: AiCompletionIntent;
}

export const AI_WRITING_DEFAULTS = {
  MODE: AI_WRITING_MODE.STANDARD,
  STYLE: AI_WRITING_STYLE.CONCISE,
  SCENARIO: AI_WRITING_SCENARIO.GENERAL,
  AUTO_CONTINUE: true,
} as const;

export const AI_PROMPT_PRESETS = {
  EDITOR_DEFAULT: 'editor-default',
  EDITOR_REWRITE: 'editor-rewrite',
  EDITOR_EXPAND: 'editor-expand',
  EDITOR_SIMPLIFY: 'editor-simplify',
  EDITOR_SUMMARIZE: 'editor-summarize',
  EDITOR_TRANSLATE: 'editor-translate',
} as const;

export type AiPromptPreset = (typeof AI_PROMPT_PRESETS)[keyof typeof AI_PROMPT_PRESETS];

export const AI_TRANSLATION_TARGETS = {
  'zh-CN': { nativeLabel: '简体中文', promptLabelZhCn: '简体中文', promptLabelEnUs: 'Simplified Chinese' },
  'en-US': { nativeLabel: 'English', promptLabelZhCn: '英语', promptLabelEnUs: 'English' },
  'zh-TW': { nativeLabel: '繁體中文 (台灣)', promptLabelZhCn: '繁体中文（台湾）', promptLabelEnUs: 'Traditional Chinese (Taiwan)' },
  'ja-JP': { nativeLabel: '日本語', promptLabelZhCn: '日语', promptLabelEnUs: 'Japanese' },
  'ko-KR': { nativeLabel: '한국어', promptLabelZhCn: '韩语', promptLabelEnUs: 'Korean' },
} as const;

export type AiTranslationTargetLanguage = keyof typeof AI_TRANSLATION_TARGETS;

export const AI_TRANSLATION_DEFAULT_TARGET = 'zh-CN' as const satisfies AiTranslationTargetLanguage;

export const AI_TRANSLATION_TARGET_ORDER = [
  'zh-CN',
  'en-US',
  'zh-TW',
  'ja-JP',
  'ko-KR',
] as const satisfies readonly AiTranslationTargetLanguage[];

const AI_WRITING_STYLE_VALUES = new Set<AiWritingStyle>(Object.values(AI_WRITING_STYLE));
const AI_WRITING_SCENARIO_VALUES = new Set<AiWritingScenario>(Object.values(AI_WRITING_SCENARIO));
const AI_WRITING_MODE_VALUES = new Set<AiWritingMode>(Object.values(AI_WRITING_MODE));
const AI_COMPLETION_INTENT_VALUES = new Set<AiCompletionIntent>(Object.values(AI_COMPLETION_INTENT));
const AI_PROMPT_PRESET_VALUES = new Set<AiPromptPreset>(Object.values(AI_PROMPT_PRESETS));

export function isValidAiWritingStyle(value: unknown): value is AiWritingStyle {
  return AI_WRITING_STYLE_VALUES.has(value as AiWritingStyle);
}

export function isValidAiWritingScenario(value: unknown): value is AiWritingScenario {
  return AI_WRITING_SCENARIO_VALUES.has(value as AiWritingScenario);
}

export function isValidAiWritingMode(value: unknown): value is AiWritingMode {
  return AI_WRITING_MODE_VALUES.has(value as AiWritingMode);
}

export function isValidAiCompletionIntent(value: unknown): value is AiCompletionIntent {
  return AI_COMPLETION_INTENT_VALUES.has(value as AiCompletionIntent);
}

export function isValidAiPromptPreset(value: unknown): value is AiPromptPreset {
  return AI_PROMPT_PRESET_VALUES.has(value as AiPromptPreset);
}

export function isValidAiTranslationTargetLanguage(
  value: unknown,
): value is AiTranslationTargetLanguage {
  return typeof value === 'string' && Object.hasOwn(AI_TRANSLATION_TARGETS, value);
}

export function normalizeAiTranslationTargetLanguage(
  value: unknown,
): AiTranslationTargetLanguage {
  return isValidAiTranslationTargetLanguage(value)
    ? value
    : AI_TRANSLATION_DEFAULT_TARGET;
}
