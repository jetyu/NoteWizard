const LEGACY_SNAPTIUM_AI_SOURCE_IDS = new Set<string>([
  'snaptium-official-chat',
  'snaptium-official-embedding',
  'snaptium-official-reranker',
]);

export interface AiSourceCapabilityReference {
  id: string;
  capabilities: string[];
}

export function isLegacySnaptiumAiSourceId(value: string): boolean {
  return LEGACY_SNAPTIUM_AI_SOURCE_IDS.has(value);
}

export function hasUsableAiSource(
  sources: readonly AiSourceCapabilityReference[],
  sourceId: string,
  capability: string,
): boolean {
  if (!sourceId || isLegacySnaptiumAiSourceId(sourceId)) {
    return false;
  }

  const source = sources.find(item => item.id === sourceId);
  return Boolean(source && (source.capabilities.length === 0 || source.capabilities.includes(capability)));
}
