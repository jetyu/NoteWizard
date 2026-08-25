import { AI_COMPLETION_INTENT } from '@shared/ai.constants';
import {
  buildAiCompletionContext,
  sanitizeAiCompletionSuggestion,
} from '@renderer/features/ai/services/aiCompletion.service';

describe('AI completion context', () => {
  it('includes the note title, nearest heading, bounded surrounding text, and bridge intent', () => {
    const documentText = `${'前'.repeat(2100)}\n## 唐代诗歌\n李白，中国著名诗人，后世称其为诗仙。`;
    const cursorPosition = documentText.indexOf('，后世');
    const context = buildAiCompletionContext({
      documentText,
      cursorPosition,
      noteTitle: '人物介绍',
    });

    expect(context.context).toHaveLength(2000);
    expect(context.contextAfter).toBe('，后世称其为诗仙。');
    expect(context.noteTitle).toBe('人物介绍');
    expect(context.sectionHeading).toBe('唐代诗歌');
    expect(context.intent).toBe(AI_COMPLETION_INTENT.BRIDGE_TEXT);
  });

  it('distinguishes sentence continuation from paragraph continuation', () => {
    const sentence = buildAiCompletionContext({
      documentText: '李白是唐代',
      cursorPosition: 6,
    });
    const paragraph = buildAiCompletionContext({
      documentText: '李白是唐代著名诗人。',
      cursorPosition: 10,
    });

    expect(sentence.intent).toBe(AI_COMPLETION_INTENT.CONTINUE_SENTENCE);
    expect(paragraph.intent).toBe(AI_COMPLETION_INTENT.CONTINUE_PARAGRAPH);
  });
});

describe('AI completion result quality gate', () => {
  it('removes an echoed source suffix before display', () => {
    const suggestion = sanitizeAiCompletionSuggestion({
      context: '李白，中国著名诗人',
      intent: AI_COMPLETION_INTENT.CONTINUE_SENTENCE,
    }, '李白，中国著名诗人，以浪漫主义诗歌闻名');

    expect(suggestion).toBe('，以浪漫主义诗歌闻名');
  });

  it('rejects a near-duplicate restatement of the recent phrase', () => {
    const suggestion = sanitizeAiCompletionSuggestion({
      context: '李白，中国著名诗人',
      intent: AI_COMPLETION_INTENT.CONTINUE_SENTENCE,
    }, '李白是中国著名诗人，以浪漫主义诗歌闻名。');

    expect(suggestion).toBeNull();
  });

  it('removes text already present after the cursor', () => {
    const suggestion = sanitizeAiCompletionSuggestion({
      context: '他决定',
      contextAfter: '后来返回故乡。',
      intent: AI_COMPLETION_INTENT.BRIDGE_TEXT,
    }, '先独自远行，后来');

    expect(suggestion).toBe('先独自远行，');
  });

  it('preserves English word boundaries around inserted text', () => {
    const suggestion = sanitizeAiCompletionSuggestion({
      context: 'Li Bai was a famous',
      contextAfter: 'poet of the Tang dynasty.',
      intent: AI_COMPLETION_INTENT.BRIDGE_TEXT,
    }, 'Chinese');

    expect(suggestion).toBe(' Chinese ');
  });
});
