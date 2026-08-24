import {
  AI_WRITING_DEFAULTS,
  AI_WRITING_SCENARIO,
  AI_WRITING_STYLE,
  type AiWritingScenario,
  type AiWritingStyle,
} from '../../shared/ai.constants.js';

const STYLE_PROMPTS_ZH_CN = {
  [AI_WRITING_STYLE.CONCISE]: '写作风格：简洁。强调直接、紧凑、无冗余的表达。',
  [AI_WRITING_STYLE.RIGOROUS]: '写作风格：严谨。强调逻辑准确、依据清晰、概念精确。',
  [AI_WRITING_STYLE.PROFESSIONAL]: '写作风格：专业。强调术语准确、语气可靠、表达成熟。',
  [AI_WRITING_STYLE.ACCESSIBLE]: '写作风格：通俗。强调易懂表达，避免不必要术语。',
  [AI_WRITING_STYLE.VIVID]: '写作风格：生动。强调画面感、节奏感和适度表现力。',
} as const satisfies Record<AiWritingStyle, string>;

const SCENARIO_PROMPTS_ZH_CN = {
  [AI_WRITING_SCENARIO.GENERAL]: '写作场景：通用写作。保持自然、清晰，适用于日常写作任务。',
  [AI_WRITING_SCENARIO.TECHNICAL_DOCUMENT]: '写作场景：技术文档。保持术语准确、结构清晰，并在需要时明确步骤或约束。',
  [AI_WRITING_SCENARIO.PRODUCT_DOCUMENT]: '写作场景：产品文档。聚焦功能说明、用户价值、使用方式和边界。',
  [AI_WRITING_SCENARIO.SUMMARY_REPORT]: '写作场景：总结汇报。优先突出结论、进展、问题和下一步行动。',
  [AI_WRITING_SCENARIO.DAILY_RECORD]: '写作场景：日常记录。保持自然、真实，并方便后续快速回看。',
  [AI_WRITING_SCENARIO.CONTENT_CREATION]: '写作场景：内容创作。兼顾可读性、吸引力和表达推进。',
  [AI_WRITING_SCENARIO.OFFICIAL_WRITING]: '写作场景：公文写作。保持政府类公文写作风格、具备正式、稳健、合规和结构完整。',
} as const satisfies Record<AiWritingScenario, string>;

const STYLE_PROMPTS_EN_US = {
  [AI_WRITING_STYLE.CONCISE]: 'Writing style: concise. Emphasize direct, compact wording without redundancy.',
  [AI_WRITING_STYLE.RIGOROUS]: 'Writing style: rigorous. Emphasize logical precision, clear grounding, and accurate concepts.',
  [AI_WRITING_STYLE.PROFESSIONAL]: 'Writing style: professional. Emphasize reliable wording, accurate terminology, and a polished tone.',
  [AI_WRITING_STYLE.ACCESSIBLE]: 'Writing style: accessible. Emphasize easy-to-understand wording and avoid unnecessary jargon.',
  [AI_WRITING_STYLE.VIVID]: 'Writing style: vivid. Emphasize imagery, rhythm, and expressive wording when appropriate.',
} as const satisfies Record<AiWritingStyle, string>;

const SCENARIO_PROMPTS_EN_US = {
  [AI_WRITING_SCENARIO.GENERAL]: 'Writing scenario: general writing. Keep the continuation natural, clear, and broadly applicable to everyday writing tasks.',
  [AI_WRITING_SCENARIO.TECHNICAL_DOCUMENT]: 'Writing scenario: technical documentation. Keep terminology accurate, structure clear, and steps or constraints explicit when relevant.',
  [AI_WRITING_SCENARIO.PRODUCT_DOCUMENT]: 'Writing scenario: product documentation. Focus on feature explanation, user value, usage guidance, and scope boundaries.',
  [AI_WRITING_SCENARIO.SUMMARY_REPORT]: 'Writing scenario: summary and reporting. Highlight conclusions, progress, issues, and next actions with strong prioritization.',
  [AI_WRITING_SCENARIO.DAILY_RECORD]: 'Writing scenario: daily notes. Keep the continuation natural, candid, and easy to scan later.',
  [AI_WRITING_SCENARIO.CONTENT_CREATION]: 'Writing scenario: content creation. Balance readability, appeal, and momentum while keeping the content coherent and complete.',
  [AI_WRITING_SCENARIO.OFFICIAL_WRITING]: 'Writing scenario: official writing. Keep the continuation formal, compliant, measured, and structurally complete.',
} as const satisfies Record<AiWritingScenario, string>;

export function buildWritingPreferencesPromptZhCn(
  writingStyle: AiWritingStyle,
  writingScenario: AiWritingScenario,
): string {
  return [
    STYLE_PROMPTS_ZH_CN[writingStyle] ?? STYLE_PROMPTS_ZH_CN[AI_WRITING_DEFAULTS.STYLE],
    SCENARIO_PROMPTS_ZH_CN[writingScenario] ?? SCENARIO_PROMPTS_ZH_CN[AI_WRITING_DEFAULTS.SCENARIO],
  ].join('\n');
}

export function buildWritingPreferencesPromptEnUs(
  writingStyle: AiWritingStyle,
  writingScenario: AiWritingScenario,
): string {
  return [
    STYLE_PROMPTS_EN_US[writingStyle] ?? STYLE_PROMPTS_EN_US[AI_WRITING_DEFAULTS.STYLE],
    SCENARIO_PROMPTS_EN_US[writingScenario] ?? SCENARIO_PROMPTS_EN_US[AI_WRITING_DEFAULTS.SCENARIO],
  ].join('\n');
}
