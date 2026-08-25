import {
  AI_COMPLETION_INTENT,
  AI_PROMPT_PRESETS,
  AI_WRITING_SCENARIO,
  AI_WRITING_STYLE,
} from '@shared/ai.constants';
import {
  buildAssistantSystemPrompt,
  buildAssistantUserPrompt,
  buildEditorSystemPrompt,
} from '../../electron/main/prompts/index';

vi.mock('../../electron/main/services/log/logger.service', () => ({
  loggerService: {
    createLogger: () => ({
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

describe('global Smart Writing preferences', () => {
  it('applies the same Chinese writing preferences to continuation and editor operations', () => {
    const continuationPrompt = buildAssistantSystemPrompt(
      'zh-CN',
      '这是一段需要继续写作的正文',
      AI_WRITING_STYLE.VIVID,
      AI_WRITING_SCENARIO.CONTENT_CREATION,
    );
    const rewritePrompt = buildEditorSystemPrompt(
      'zh-CN',
      '这是一段需要改写的正文',
      AI_PROMPT_PRESETS.EDITOR_REWRITE,
      AI_WRITING_STYLE.VIVID,
      AI_WRITING_SCENARIO.CONTENT_CREATION,
    );

    for (const prompt of [continuationPrompt, rewritePrompt]) {
      expect(prompt).toContain('写作风格：生动');
      expect(prompt).toContain('写作场景：内容创作');
    }
    expect(rewritePrompt).toContain('在不违背当前操作目标、原意、输出格式和语言要求的前提下');
  });

  it('uses position-aware continuation length and treats preferences as secondary', () => {
    const paragraphPrompt = buildAssistantSystemPrompt(
      'zh-CN',
      '李白，中国著名诗人。',
      AI_WRITING_STYLE.VIVID,
      AI_WRITING_SCENARIO.CONTENT_CREATION,
      AI_COMPLETION_INTENT.CONTINUE_PARAGRAPH,
    );
    const bridgePrompt = buildAssistantSystemPrompt(
      'zh-CN',
      '李白，中国著名诗人',
      AI_WRITING_STYLE.PROFESSIONAL,
      AI_WRITING_SCENARIO.GENERAL,
      AI_COMPLETION_INTENT.BRIDGE_TEXT,
    );

    expect(paragraphPrompt).toContain('一至两句话');
    expect(paragraphPrompt).toContain('次要偏好');
    expect(bridgePrompt).toContain('同时与 beforeCursor 和 afterCursor 自然衔接');
    expect(bridgePrompt).toContain('错误输出是“李白，中国著名诗人');
  });

  it('serializes title, section, and both cursor sides as writing context', () => {
    const userPrompt = buildAssistantUserPrompt({
      context: '李白，中国著名诗人',
      contextAfter: '其作品流传至今。',
      noteTitle: '李白简介',
      sectionHeading: '生平',
      intent: AI_COMPLETION_INTENT.BRIDGE_TEXT,
    });

    expect(JSON.parse(userPrompt)).toEqual({
      noteTitle: '李白简介',
      sectionHeading: '生平',
      beforeCursor: '李白，中国著名诗人',
      cursor: '<cursor>',
      afterCursor: '其作品流传至今。',
    });
  });

  it('applies English writing preferences to editor operations', () => {
    const summarizePrompt = buildEditorSystemPrompt(
      'en-US',
      'This text should be summarized.',
      AI_PROMPT_PRESETS.EDITOR_SUMMARIZE,
      AI_WRITING_STYLE.PROFESSIONAL,
      AI_WRITING_SCENARIO.SUMMARY_REPORT,
    );

    expect(summarizePrompt).toContain('Writing style: professional');
    expect(summarizePrompt).toContain('Writing scenario: summary and reporting');
    expect(summarizePrompt).toContain('only the summary');
  });

  it('keeps translation requirements authoritative when preferences are present', () => {
    const translationPrompt = buildEditorSystemPrompt(
      'zh-CN',
      '这是一段需要翻译的正文',
      AI_PROMPT_PRESETS.EDITOR_TRANSLATE,
      AI_WRITING_STYLE.RIGOROUS,
      AI_WRITING_SCENARIO.TECHNICAL_DOCUMENT,
      'en-US',
    );

    expect(translationPrompt).toContain('输出语言必须为英语');
    expect(translationPrompt).toContain('准确保留原意、语气、段落和换行');
    expect(translationPrompt).toContain('只返回译文，不要附加解释');
    expect(translationPrompt).toContain('写作风格：严谨');
    expect(translationPrompt).toContain('写作场景：技术文档');
  });
});
