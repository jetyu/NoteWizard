import {
  AI_COMPLETION_INTENT,
  type AiCompletionPromptContext,
} from '@shared/ai.constants';
import { AI_ASSISTANT_DEFAULTS } from '../constants/ai.constants';

const HEADING_REGEX = /^#{1,6}\s+(.+?)\s*#*\s*$/gm;
const PARAGRAPH_BOUNDARY_REGEX = /(?:[。！？.!?][”’"'）】]*|\n\s*)$/u;
const MEANINGFUL_TEXT_REGEX = /[\p{L}\p{N}\u3400-\u9fff]/u;
const COMPARISON_CLEANUP_REGEX = /[\p{P}\p{S}\s]/gu;
const SENTENCE_BOUNDARY_REGEX = /[。！？.!?\n]/u;
const CJK_REGEX = /[\u3400-\u9fff]/u;
const LATIN_WORD_BOUNDARY_REGEX = /[A-Za-z0-9]/;
const MAX_OVERLAP_LENGTH = 240;
const MIN_SIMILARITY_LENGTH = 6;
const REPETITION_SIMILARITY_THRESHOLD = 0.78;

export interface AiCompletionDocumentInput {
  documentText: string;
  cursorPosition: number;
  noteTitle?: string;
}

function findCurrentHeading(beforeCursor: string): string | undefined {
  let heading: string | undefined;
  for (const match of beforeCursor.matchAll(HEADING_REGEX)) {
    heading = match[1]?.trim() || heading;
  }
  return heading?.slice(0, 200);
}

export function buildAiCompletionContext(input: AiCompletionDocumentInput): AiCompletionPromptContext {
  const cursorPosition = Math.max(0, Math.min(input.cursorPosition, input.documentText.length));
  const fullBeforeCursor = input.documentText.slice(0, cursorPosition);
  const fullAfterCursor = input.documentText.slice(cursorPosition);
  const hasFollowingText = MEANINGFUL_TEXT_REGEX.test(fullAfterCursor);
  const intent = hasFollowingText
    ? AI_COMPLETION_INTENT.BRIDGE_TEXT
    : PARAGRAPH_BOUNDARY_REGEX.test(fullBeforeCursor)
      ? AI_COMPLETION_INTENT.CONTINUE_PARAGRAPH
      : AI_COMPLETION_INTENT.CONTINUE_SENTENCE;

  return {
    context: fullBeforeCursor.slice(-AI_ASSISTANT_DEFAULTS.CONTEXT_LENGTH),
    contextAfter: fullAfterCursor.slice(0, AI_ASSISTANT_DEFAULTS.CONTEXT_AFTER_LENGTH) || undefined,
    noteTitle: input.noteTitle?.trim().slice(0, 200) || undefined,
    sectionHeading: findCurrentHeading(fullBeforeCursor),
    intent,
  };
}

function minimumOverlapLength(text: string): number {
  return CJK_REGEX.test(text) ? 2 : 4;
}

function findExactOverlap(left: string, right: string): number {
  const maximum = Math.min(left.length, right.length, MAX_OVERLAP_LENGTH);
  for (let length = maximum; length >= minimumOverlapLength(`${left}${right}`); length -= 1) {
    if (left.slice(-length) === right.slice(0, length)) {
      return length;
    }
  }
  return 0;
}

function normalizeForComparison(text: string): string {
  return text.toLocaleLowerCase().replace(COMPARISON_CLEANUP_REGEX, '');
}

function createBigrams(text: string): string[] {
  if (text.length < 2) {
    return text ? [text] : [];
  }
  const bigrams: string[] = [];
  for (let index = 0; index < text.length - 1; index += 1) {
    bigrams.push(text.slice(index, index + 2));
  }
  return bigrams;
}

function calculateDiceSimilarity(left: string, right: string): number {
  const leftBigrams = createBigrams(left);
  const rightBigrams = createBigrams(right);
  if (leftBigrams.length === 0 || rightBigrams.length === 0) {
    return 0;
  }

  const available = new Map<string, number>();
  for (const bigram of leftBigrams) {
    available.set(bigram, (available.get(bigram) ?? 0) + 1);
  }

  let matches = 0;
  for (const bigram of rightBigrams) {
    const count = available.get(bigram) ?? 0;
    if (count > 0) {
      matches += 1;
      available.set(bigram, count - 1);
    }
  }

  return (2 * matches) / (leftBigrams.length + rightBigrams.length);
}

function getRecentPhrase(context: string): string {
  const segments = context.split(SENTENCE_BOUNDARY_REGEX);
  return (segments.at(-1) || segments.at(-2) || context).trim().slice(-80);
}

function getFirstPhrase(suggestion: string): string {
  return suggestion.split(SENTENCE_BOUNDARY_REGEX)[0]?.trim().slice(0, 80) ?? '';
}

function isNearDuplicate(context: string, suggestion: string): boolean {
  const recentPhrase = normalizeForComparison(getRecentPhrase(context));
  const firstPhrase = normalizeForComparison(getFirstPhrase(suggestion));
  if (recentPhrase.length < MIN_SIMILARITY_LENGTH || firstPhrase.length < MIN_SIMILARITY_LENGTH) {
    return false;
  }

  const minimumPrefixLength = Math.max(MIN_SIMILARITY_LENGTH, recentPhrase.length - 2);
  const maximumPrefixLength = Math.min(firstPhrase.length, recentPhrase.length + 2);
  for (let length = minimumPrefixLength; length <= maximumPrefixLength; length += 1) {
    if (
      calculateDiceSimilarity(recentPhrase, firstPhrase.slice(0, length))
      >= REPETITION_SIMILARITY_THRESHOLD
    ) {
      return true;
    }
  }

  return false;
}

function normalizeWordBoundaries(context: string, contextAfter: string, suggestion: string): string {
  let normalized = suggestion;
  const previousCharacter = context.at(-1) ?? '';
  const firstCharacter = normalized[0] ?? '';
  if (
    LATIN_WORD_BOUNDARY_REGEX.test(previousCharacter)
    && LATIN_WORD_BOUNDARY_REGEX.test(firstCharacter)
  ) {
    normalized = ` ${normalized}`;
  }

  const lastCharacter = normalized.at(-1) ?? '';
  const followingCharacter = contextAfter[0] ?? '';
  if (
    LATIN_WORD_BOUNDARY_REGEX.test(lastCharacter)
    && LATIN_WORD_BOUNDARY_REGEX.test(followingCharacter)
  ) {
    normalized = `${normalized} `;
  }
  return normalized;
}

export function sanitizeAiCompletionSuggestion(
  promptContext: AiCompletionPromptContext,
  answer: string,
): string | null {
  let suggestion = answer
    .replace(/\r\n?/g, '\n')
    .replace(/\s*\n+\s*/g, ' ')
    .trim();
  if (!MEANINGFUL_TEXT_REGEX.test(suggestion)) {
    return null;
  }

  const prefixOverlap = findExactOverlap(promptContext.context, suggestion);
  if (prefixOverlap > 0) {
    suggestion = suggestion.slice(prefixOverlap).trimStart();
  }

  const contextAfter = promptContext.contextAfter ?? '';
  const suffixOverlap = findExactOverlap(suggestion, contextAfter.trimStart());
  if (suffixOverlap > 0) {
    suggestion = suggestion.slice(0, -suffixOverlap).trimEnd();
  }

  if (!MEANINGFUL_TEXT_REGEX.test(suggestion) || isNearDuplicate(promptContext.context, suggestion)) {
    return null;
  }

  return normalizeWordBoundaries(promptContext.context, contextAfter, suggestion);
}
