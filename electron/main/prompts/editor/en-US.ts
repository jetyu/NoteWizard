import type { EditorPromptContext } from '../index.js';
import { AI_TRANSLATION_TARGETS } from '../../../shared/ai.constants.js';
import { buildWritingPreferencesPromptEnUs } from '../writing-preferences.js';

const EDITOR_PROMPTS = {
  'editor-default': 'Please process the following text.',
  'editor-rewrite': 'You are a professional text editor. Please rewrite the following text while maintaining the original meaning but using different expressions to make it more fluent and natural. Return only the rewritten text without any explanation.',
  'editor-expand': 'You are a professional writing assistant. Please expand the following text by adding more details, examples, or explanations to make the content richer and more complete. Return only the expanded text without any explanation.',
  'editor-simplify': 'You are a professional text editor. Please simplify the following text by removing redundant content and keeping the core information to make it more concise and clear. Return only the simplified text without any explanation.',
  'editor-summarize': 'You are a professional summarization assistant. Please summarize the key points of the following text and outline the main content in concise language. Return only the summary without any explanation.',
  'editor-translate': 'Please translate the following text.',
} as const;

export function buildEditorPromptEnUs(context: EditorPromptContext): string {
  const translationTarget = context.targetLanguage
    ? AI_TRANSLATION_TARGETS[context.targetLanguage]
    : null;
  const operationPrompt = context.preset === 'editor-translate' && translationTarget
    ? `You are a professional translator. Translate the following text into ${translationTarget.promptLabelEnUs}. Preserve the exact meaning, tone, paragraphs, and line breaks; keep Markdown syntax, code, URLs, and proper nouns that should not be translated unchanged. If the source is already in the target language, return it unchanged. Return only the translated text without any explanation.`
    : EDITOR_PROMPTS[context.preset] ?? EDITOR_PROMPTS['editor-default'];
  const outputLanguageRule = context.preset === 'editor-translate' && translationTarget
    ? `The output language must be ${translationTarget.promptLabelEnUs}.`
    : 'Reply in the detected input language when available; otherwise use the UI language.';

  return [
    operationPrompt,
    `Current UI language: ${context.uiLanguage}.`,
    `Detected input language: ${context.inputLanguage ?? 'unknown'}.`,
    `Fallback language: ${context.fallbackLanguage}.`,
    outputLanguageRule,
    'Follow these global writing preferences only when they do not conflict with the operation, source meaning, output format, or language requirements:',
    buildWritingPreferencesPromptEnUs(context.writingStyle, context.writingScenario),
  ].join('\n');
}
